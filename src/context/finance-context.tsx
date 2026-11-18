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
import { SANITIZERS } from "@/lib/backup";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { monthKeyOf, todayISO, type MonthKey } from "@/lib/format";
import {
  clearLocalData,
  hasLocalData,
  readLocalData,
  readLocalMode,
  writeLocalData,
  writeLocalMode,
} from "@/lib/local-store";
import { buildSampleData } from "@/lib/sample-data";
import {
  COLLECTIONS,
  EMPTY_DATA,
  type CollectionName,
  type EntityMap,
  type FinanceData,
} from "@/lib/types";

export type AppMode = "loading" | "signed-out" | "local" | "cloud";

export interface FinanceUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
}

interface FinanceContextValue {
  mode: AppMode;
  user: FinanceUser | null;
  cloudAvailable: boolean;
  /** dados carregados (local ou primeira sincronização da nuvem) */
  ready: boolean;
  data: FinanceData;
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
  startLocal: (withSample: boolean) => void;
  exitLocal: () => void;
  localDataAvailable: boolean;
  importLocalToCloud: () => Promise<void>;
  loadSample: () => Promise<boolean>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

const NOT_LOADED: Record<CollectionName, boolean> = {
  accounts: false,
  cards: false,
  subscriptions: false,
  transactions: false,
  goals: false,
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

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("loading");
  const [user, setUser] = useState<FinanceUser | null>(null);
  const [data, setData] = useState<FinanceData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState<Record<CollectionName, boolean>>(NOT_LOADED);
  const [today] = useState(() => (typeof window === "undefined" ? "" : todayISO()));
  const [month, setMonth] = useState<MonthKey>(() => (typeof window === "undefined" ? "" : monthKeyOf(todayISO())));
  const [cuts, setCuts] = useState<Set<string>>(() => new Set());
  const [localDataAvailable, setLocalDataAvailable] = useState(false);

  // Resolve o modo: usuário do Google (nuvem), modo local ou tela de entrada.
  useEffect(() => {
    let active = true;
    const resolveWithoutUser = () => {
      if (!active) return;
      setUser(null);
      setLocalDataAvailable(hasLocalData());
      if (readLocalMode()) {
        setData(readLocalData() ?? EMPTY_DATA);
        setMode("local");
      } else {
        setData(EMPTY_DATA);
        setMode("signed-out");
      }
    };

    const firebase = getFirebase();
    if (!firebase) {
      queueMicrotask(resolveWithoutUser);
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
        setLocalDataAvailable(hasLocalData());
        setLoaded(NOT_LOADED);
        setData(EMPTY_DATA);
        setMode("cloud");
      } else {
        resolveWithoutUser();
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Sincronização em tempo real com o Firestore: users/{uid}/{coleção}
  const uid = mode === "cloud" ? user?.uid : undefined;
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
          setData((prev) => ({ ...prev, [name]: items }));
          setLoaded((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
        },
        (error) => {
          console.error(`[MoneySave] erro ao sincronizar ${name}`, error);
          toast.error("Não foi possível sincronizar com a nuvem.", { description: firebaseErrorMessage(error) });
          setLoaded((prev) => ({ ...prev, [name]: true }));
        },
      ),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [uid]);

  // Modo local: grava tudo no navegador a cada mudança
  useEffect(() => {
    if (mode === "local") writeLocalData(data);
  }, [mode, data]);

  const save = useCallback(
    <C extends CollectionName>(name: C, item: EntityMap[C]) => {
      const record = { ...item, updatedAt: Date.now() } as EntityMap[C];
      if (mode === "cloud" && user) {
        const firebase = getFirebase();
        if (!firebase) return;
        // Sem await: o cache local do Firestore atualiza a tela na hora (também offline).
        setDoc(doc(firebase.db, "users", user.uid, name, record.id), clean(record)).catch((error) => {
          toast.error("Não foi possível salvar na nuvem.", { description: firebaseErrorMessage(error) });
        });
        return;
      }
      setData((prev) => {
        const list = prev[name] as EntityMap[C][];
        const exists = list.some((entry) => entry.id === record.id);
        const next = exists ? list.map((entry) => (entry.id === record.id ? record : entry)) : [...list, record];
        return { ...prev, [name]: next };
      });
    },
    [mode, user],
  );

  const remove = useCallback(
    (name: CollectionName, id: string) => {
      if (mode === "cloud" && user) {
        const firebase = getFirebase();
        if (!firebase) return;
        deleteDoc(doc(firebase.db, "users", user.uid, name, id)).catch((error) => {
          toast.error("Não foi possível excluir na nuvem.", { description: firebaseErrorMessage(error) });
        });
        return;
      }
      setData((prev) => ({ ...prev, [name]: (prev[name] as { id: string }[]).filter((entry) => entry.id !== id) }));
    },
    [mode, user],
  );

  const writeAllToCloud = useCallback(
    async (uidValue: string, next: FinanceData, deleteExisting: FinanceData | null) => {
      const firebase = getFirebase();
      if (!firebase) return false;
      type Op = { kind: "set"; name: CollectionName; id: string; value: object } | { kind: "delete"; name: CollectionName; id: string };
      const ops: Op[] = [];
      if (deleteExisting) {
        for (const name of COLLECTIONS) {
          const keep = new Set(next[name].map((entry) => entry.id));
          for (const entry of deleteExisting[name]) if (!keep.has(entry.id)) ops.push({ kind: "delete", name, id: entry.id });
        }
      }
      for (const name of COLLECTIONS) {
        for (const entry of next[name]) ops.push({ kind: "set", name, id: entry.id, value: clean({ ...entry, updatedAt: Date.now() }) });
      }
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(firebase.db);
        for (const op of ops.slice(i, i + 400)) {
          const ref = doc(firebase.db, "users", uidValue, op.name, op.id);
          if (op.kind === "delete") batch.delete(ref);
          else batch.set(ref, op.value);
        }
        await batch.commit();
      }
      return true;
    },
    [],
  );

  const replaceAll = useCallback(
    async (next: FinanceData) => {
      if (mode === "cloud" && user) {
        try {
          return await writeAllToCloud(user.uid, next, data);
        } catch (error) {
          toast.error("Não foi possível gravar na nuvem.", { description: firebaseErrorMessage(error) });
          return false;
        }
      }
      setData(next);
      return true;
    },
    [mode, user, data, writeAllToCloud],
  );

  const loadSample = useCallback(() => replaceAll(buildSampleData(todayISO())), [replaceAll]);

  const importLocalToCloud = useCallback(async () => {
    if (mode !== "cloud" || !user) return;
    const local = readLocalData();
    if (!local) return;
    try {
      await writeAllToCloud(user.uid, local, null);
      clearLocalData();
      writeLocalMode(false);
      setLocalDataAvailable(false);
      toast.success("Dados do modo local enviados para a sua conta.");
    } catch (error) {
      toast.error("Não foi possível enviar os dados.", { description: firebaseErrorMessage(error) });
    }
  }, [mode, user, writeAllToCloud]);

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
      writeLocalMode(false);
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
    const firebase = getFirebase();
    if (firebase) await signOut(firebase.auth);
    // Recarga completa de propósito: limpa o estado em memória (inclusive páginas preservadas pelo
    // <Activity> do Cache Components) do usuário anterior — recomendação do guia do Next.js 16.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }, []);

  const startLocal = useCallback((withSample: boolean) => {
    const existing = readLocalData();
    const next = withSample ? buildSampleData(todayISO()) : existing ?? EMPTY_DATA;
    writeLocalMode(true);
    writeLocalData(next);
    setData(next);
    setLocalDataAvailable(true);
    setMode("local");
  }, []);

  const exitLocal = useCallback(() => {
    writeLocalMode(false);
    setLocalDataAvailable(hasLocalData());
    setData(EMPTY_DATA);
    setMode("signed-out");
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

  const ready = mode === "local" || (mode === "cloud" && COLLECTIONS.every((name) => loaded[name]));

  const value = useMemo<FinanceContextValue>(
    () => ({
      mode,
      user,
      cloudAvailable: isFirebaseConfigured,
      ready,
      data,
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
      startLocal,
      exitLocal,
      localDataAvailable,
      importLocalToCloud,
      loadSample,
    }),
    [mode, user, ready, data, today, month, cuts, toggleCut, clearCuts, save, remove, replaceAll, signIn, signOutUser, startLocal, exitLocal, localDataAvailable, importLocalToCloud, loadSample],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance precisa estar dentro de <FinanceProvider>");
  return context;
}
