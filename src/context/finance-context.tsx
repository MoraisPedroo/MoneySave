"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { toast } from "sonner";
import { SANITIZERS, sanitizeData } from "@/lib/backup";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { currentMonthKey, monthKeyOf, todayISO, type MonthKey } from "@/lib/format";
import { buildSampleData } from "@/lib/sample-data";
import {
  COLLECTIONS,
  EMPTY_DATA,
  type CollectionName,
  type EntityMap,
  type FinanceData,
} from "@/lib/types";

export type AppMode = "loading" | "signed-out" | "cloud";

export interface FinanceUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
}

/** Preferências guardadas em users/{uid} (tutorial e checklist de primeiros passos). */
export interface UserProfile {
  tutorial: "done" | "skipped" | null;
  onboardingDone: boolean;
  skippedSteps: string[];
}

const DEFAULT_PROFILE: UserProfile = { tutorial: null, onboardingDone: false, skippedSteps: [] };

function sanitizeProfile(raw: unknown): UserProfile {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    tutorial: source.tutorial === "done" || source.tutorial === "skipped" ? source.tutorial : null,
    onboardingDone: source.onboardingDone === true,
    skippedSteps: Array.isArray(source.skippedSteps) ? source.skippedSteps.filter((s): s is string => typeof s === "string") : [],
  };
}

/** Login de teste só em desenvolvimento (npm run dev): dados em memória, nada vai para o Firebase. */
const DEV_LOGIN_ENABLED = process.env.NODE_ENV === "development";
const DEV_SESSION_KEY = "moneysave:dev-session";

interface FinanceContextValue {
  mode: AppMode;
  user: FinanceUser | null;
  cloudAvailable: boolean;
  /** dados carregados (primeira sincronização da nuvem) */
  ready: boolean;
  /** dados exibidos (os reais ou os de exemplo durante o tutorial) */
  data: FinanceData;
  /** a conta ainda não tem nenhum dado cadastrado */
  isRealDataEmpty: boolean;
  today: string;
  month: MonthKey;
  setMonth: (month: MonthKey) => void;
  /** assinaturas marcadas em "Simular corte" (não são gravadas) */
  cuts: ReadonlySet<string>;
  toggleCut: (id: string) => void;
  clearCuts: () => void;
  save: <C extends CollectionName>(collectionName: C, item: EntityMap[C]) => void;
  remove: (collectionName: CollectionName, id: string) => void;
  replaceAll: (data: FinanceData) => Promise<boolean>;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  /** modo exemplo do tutorial: dados fictícios só em memória */
  sandbox: boolean;
  startSandbox: () => void;
  endSandbox: () => void;
  devLoginAvailable: boolean;
  devLogin: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

const NOT_LOADED: Record<CollectionName, boolean> = {
  accounts: false,
  cards: false,
  subscriptions: false,
  transactions: false,
  goals: false,
};
const ALL_LOADED: Record<CollectionName, boolean> = {
  accounts: true,
  cards: true,
  subscriptions: true,
  transactions: true,
  goals: true,
};

const firebaseErrorMessage = (error: unknown) => {
  const code = (error as { code?: string })?.code ?? "";
  if (code.includes("permission-denied")) return "Sem permissão para acessar os dados. Entre novamente.";
  if (code.includes("unavailable")) return "Sem conexão. Suas alterações serão enviadas quando a internet voltar.";
  if (code.includes("resource-exhausted")) return "Limite gratuito do Firebase atingido por hoje.";
  return (error as Error)?.message ?? "Erro desconhecido";
};

/** Remove campos undefined (o Firestore não aceita undefined). */
function clean<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function upsert<T extends { id: string }>(list: T[], record: T): T[] {
  return list.some((entry) => entry.id === record.id)
    ? list.map((entry) => (entry.id === record.id ? record : entry))
    : [...list, record];
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("loading");
  const [backend, setBackend] = useState<"firestore" | "memory">("firestore");
  const [user, setUser] = useState<FinanceUser | null>(null);
  const [realData, setRealData] = useState<FinanceData>(EMPTY_DATA);
  const [sandboxData, setSandboxData] = useState<FinanceData | null>(null);
  const [loaded, setLoaded] = useState<Record<CollectionName, boolean>>(NOT_LOADED);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [today] = useState(() => (typeof window === "undefined" ? "" : todayISO()));
  const [month, setMonth] = useState<MonthKey>(() => (typeof window === "undefined" ? "" : monthKeyOf(todayISO())));
  const [cuts, setCuts] = useState<Set<string>>(() => new Set());

  // Quem está logado: conta Google (Firebase Auth) ou tela de entrada.
  useEffect(() => {
    let active = true;

    if (DEV_LOGIN_ENABLED) {
      try {
        const saved = sessionStorage.getItem(DEV_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { data?: unknown; profile?: unknown };
          queueMicrotask(() => {
            if (!active) return;
            setBackend("memory");
            setUser({ uid: "dev", name: "Pedro Teste", email: "teste@local.dev", photoURL: null });
            setRealData(sanitizeData(parsed.data));
            setProfile(sanitizeProfile(parsed.profile));
            setLoaded(ALL_LOADED);
            setProfileLoaded(true);
            setMode("cloud");
          });
          return () => {
            active = false;
          };
        }
      } catch {
        /* segue para o login normal */
      }
    }

    const firebase = getFirebase();
    if (!firebase) {
      queueMicrotask(() => active && setMode("signed-out"));
      return () => {
        active = false;
      };
    }

    const unsubscribe = onAuthStateChanged(firebase.auth, (fbUser) => {
      if (!active) return;
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          name: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "Você",
          email: fbUser.email ?? "",
          photoURL: fbUser.photoURL,
        });
        setBackend("firestore");
        setLoaded(NOT_LOADED);
        setProfileLoaded(false);
        setRealData(EMPTY_DATA);
        setMode("cloud");
      } else {
        setUser(null);
        setRealData(EMPTY_DATA);
        setMode("signed-out");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Sincronização em tempo real com o Firestore: users/{uid}/{coleção} e o perfil users/{uid}
  const uid = mode === "cloud" && backend === "firestore" ? user?.uid : undefined;
  useEffect(() => {
    if (!uid) return;
    const firebase = getFirebase();
    if (!firebase) return;
    const unsubscribers = COLLECTIONS.map((name) =>
      onSnapshot(
        collection(firebase.db, "users", uid, name),
        (snapshot) => {
          const sanitize = SANITIZERS[name] as (raw: Record<string, unknown>) => EntityMap[typeof name];
          const items = snapshot.docs.map((d) => sanitize({ ...d.data(), id: d.id }));
          setRealData((prev) => ({ ...prev, [name]: items }));
          setLoaded((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
        },
        (error) => {
          console.error(`[MoneySave] erro ao sincronizar ${name}`, error);
          toast.error("Não foi possível sincronizar com a nuvem.", { description: firebaseErrorMessage(error) });
          setLoaded((prev) => ({ ...prev, [name]: true }));
        },
      ),
    );
    unsubscribers.push(
      onSnapshot(
        doc(firebase.db, "users", uid),
        (snapshot) => {
          setProfile(snapshot.exists() ? sanitizeProfile(snapshot.data()) : DEFAULT_PROFILE);
          setProfileLoaded(true);
        },
        (error) => {
          console.error("[MoneySave] erro ao ler o perfil", error);
          setProfileLoaded(true);
        },
      ),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [uid]);

  // Sessão de teste (dev): guarda em sessionStorage para sobreviver a recarregamentos
  useEffect(() => {
    if (!DEV_LOGIN_ENABLED || backend !== "memory" || mode !== "cloud") return;
    try {
      sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify({ data: realData, profile }));
    } catch {
      /* ignora */
    }
  }, [backend, mode, realData, profile]);

  const sandbox = sandboxData !== null;

  const save = useCallback(
    <C extends CollectionName>(name: C, item: EntityMap[C]) => {
      const record = { ...item, updatedAt: Date.now() } as EntityMap[C];
      if (sandbox) {
        setSandboxData((prev) => (prev ? { ...prev, [name]: upsert(prev[name] as EntityMap[C][], record) } : prev));
        return;
      }
      if (backend === "memory") {
        setRealData((prev) => ({ ...prev, [name]: upsert(prev[name] as EntityMap[C][], record) }));
        return;
      }
      const firebase = getFirebase();
      if (!firebase || !user) return;
      // Sem await: o cache local do Firestore atualiza a tela na hora (também offline).
      setDoc(doc(firebase.db, "users", user.uid, name, record.id), clean(record)).catch((error) => {
        toast.error("Não foi possível salvar na nuvem.", { description: firebaseErrorMessage(error) });
      });
    },
    [sandbox, backend, user],
  );

  const remove = useCallback(
    (name: CollectionName, id: string) => {
      const drop = (prev: FinanceData): FinanceData => ({ ...prev, [name]: (prev[name] as { id: string }[]).filter((entry) => entry.id !== id) });
      if (sandbox) {
        setSandboxData((prev) => (prev ? drop(prev) : prev));
        return;
      }
      if (backend === "memory") {
        setRealData(drop);
        return;
      }
      const firebase = getFirebase();
      if (!firebase || !user) return;
      deleteDoc(doc(firebase.db, "users", user.uid, name, id)).catch((error) => {
        toast.error("Não foi possível excluir na nuvem.", { description: firebaseErrorMessage(error) });
      });
    },
    [sandbox, backend, user],
  );

  const replaceAll = useCallback(
    async (next: FinanceData) => {
      if (sandbox) {
        setSandboxData(next);
        return true;
      }
      if (backend === "memory") {
        setRealData(next);
        return true;
      }
      const firebase = getFirebase();
      if (!firebase || !user) return false;
      try {
        type Op = { kind: "set"; name: CollectionName; id: string; value: object } | { kind: "delete"; name: CollectionName; id: string };
        const ops: Op[] = [];
        for (const name of COLLECTIONS) {
          const keep = new Set(next[name].map((entry) => entry.id));
          for (const entry of realData[name]) if (!keep.has(entry.id)) ops.push({ kind: "delete", name, id: entry.id });
          for (const entry of next[name]) ops.push({ kind: "set", name, id: entry.id, value: clean({ ...entry, updatedAt: Date.now() }) });
        }
        for (let i = 0; i < ops.length; i += 400) {
          const batch = writeBatch(firebase.db);
          for (const op of ops.slice(i, i + 400)) {
            const ref = doc(firebase.db, "users", user.uid, op.name, op.id);
            if (op.kind === "delete") batch.delete(ref);
            else batch.set(ref, op.value);
          }
          await batch.commit();
        }
        return true;
      } catch (error) {
        toast.error("Não foi possível gravar na nuvem.", { description: firebaseErrorMessage(error) });
        return false;
      }
    },
    [sandbox, backend, user, realData],
  );

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setProfile((prev) => ({ ...prev, ...patch }));
      if (backend !== "firestore") return;
      const firebase = getFirebase();
      if (!firebase || !user) return;
      setDoc(doc(firebase.db, "users", user.uid), clean({ ...patch, updatedAt: Date.now() }), { merge: true }).catch((error) => {
        console.error("[MoneySave] erro ao salvar o perfil", error);
      });
    },
    [backend, user],
  );

  const signIn = useCallback(async () => {
    const firebase = getFirebase();
    if (!firebase) {
      toast.error("Login indisponível", { description: "As chaves do Firebase não foram configuradas neste deploy." });
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(firebase.auth, provider);
    } catch (error) {
      const code = (error as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      if (code === "auth/popup-blocked") {
        toast.error("O navegador bloqueou a janela de login.", { description: "Permita pop-ups para este site e tente de novo." });
      } else if (code === "auth/unauthorized-domain") {
        toast.error("Domínio não autorizado no Firebase.", { description: "Adicione este domínio em Authentication › Configurações › Domínios autorizados." });
      } else {
        toast.error("Não foi possível entrar com o Google.", { description: code || (error as Error)?.message });
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (DEV_LOGIN_ENABLED) {
      try {
        sessionStorage.removeItem(DEV_SESSION_KEY);
      } catch {
        /* ignora */
      }
    }
    const firebase = getFirebase();
    if (firebase && backend === "firestore") await signOut(firebase.auth);
    // Recarga completa de propósito: limpa o estado em memória (inclusive páginas preservadas pelo
    // <Activity> do Cache Components) do usuário anterior — recomendação do guia do Next.js 16.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }, [backend]);

  const devLogin = useCallback(() => {
    if (!DEV_LOGIN_ENABLED) return;
    setBackend("memory");
    setUser({ uid: "dev", name: "Pedro Teste", email: "teste@local.dev", photoURL: null });
    setRealData(EMPTY_DATA);
    setProfile(DEFAULT_PROFILE);
    setLoaded(ALL_LOADED);
    setProfileLoaded(true);
    setMode("cloud");
  }, []);

  const startSandbox = useCallback(() => {
    setSandboxData(buildSampleData(todayISO()));
    setCuts(new Set());
    setMonth(currentMonthKey());
  }, []);

  const endSandbox = useCallback(() => {
    setSandboxData(null);
    setCuts(new Set());
    setMonth(currentMonthKey());
  }, []);

  const toggleCut = useCallback((id: string) => {
    setCuts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearCuts = useCallback(() => setCuts(new Set()), []);

  const ready = mode === "cloud" && profileLoaded && COLLECTIONS.every((name) => loaded[name]);
  const data = sandboxData ?? realData;
  const isRealDataEmpty = COLLECTIONS.every((name) => realData[name].length === 0);

  const value = useMemo<FinanceContextValue>(
    () => ({
      mode,
      user,
      cloudAvailable: isFirebaseConfigured,
      ready,
      data,
      isRealDataEmpty,
      today,
      month,
      setMonth,
      cuts,
      toggleCut,
      clearCuts,
      save,
      remove,
      replaceAll,
      signIn,
      signOutUser,
      profile,
      updateProfile,
      sandbox,
      startSandbox,
      endSandbox,
      devLoginAvailable: DEV_LOGIN_ENABLED,
      devLogin,
    }),
    [mode, user, ready, data, isRealDataEmpty, today, month, cuts, toggleCut, clearCuts, save, remove, replaceAll, signIn, signOutUser, profile, updateProfile, sandbox, startSandbox, endSandbox, devLogin],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance precisa estar dentro de <FinanceProvider>");
  return context;
}
