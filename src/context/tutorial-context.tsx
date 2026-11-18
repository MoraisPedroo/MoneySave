"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFinance } from "./finance-context";
import { useDialogs } from "./dialogs-context";
import { TOUR_STEPS, type TourApi, type TourStep } from "@/components/tutorial/tour-steps";

export type TutorialPhase = "tour" | "finale" | "cleaning";

interface TutorialValue {
  running: boolean;
  phase: TutorialPhase;
  stepIndex: number;
  steps: TourStep[];
  step: TourStep;
  /** convite inicial (conta nova, sem nenhum dado) */
  welcomeVisible: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  finish: () => void;
  backToTour: () => void;
  dismissWelcome: () => void;
}

const TutorialContext = createContext<TutorialValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const finance = useFinance();
  const { ready, sandbox, profile, isRealDataEmpty, startSandbox, endSandbox, updateProfile, toggleCut, clearCuts } = finance;
  const { closeAll } = useDialogs();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<TutorialPhase>("tour");
  const [stepIndex, setStepIndex] = useState(0);

  // sempre aponta para os dados/cortes mais recentes (usados nos ganchos dos passos)
  const apiRef = useRef<TourApi>({ data: finance.data, cuts: finance.cuts, toggleCut, clearCuts });
  useEffect(() => {
    apiRef.current = { data: finance.data, cuts: finance.cuts, toggleCut, clearCuts };
  });

  const welcomeVisible = ready && !running && !sandbox && profile.tutorial === null && isRealDataEmpty;

  const start = useCallback(() => {
    closeAll();
    startSandbox();
    setPhase("tour");
    setStepIndex(0);
    setRunning(true);
    router.push("/");
  }, [closeAll, startSandbox, router]);

  const end = useCallback(
    (skipped: boolean) => {
      endSandbox();
      setRunning(false);
      setPhase("tour");
      setStepIndex(0);
      if (profile.tutorial !== "done") updateProfile({ tutorial: skipped ? "skipped" : "done" });
      router.push("/");
    },
    [endSandbox, profile.tutorial, updateProfile, router],
  );

  const goTo = useCallback(
    (index: number, direction: "next" | "prev") => {
      const current = TOUR_STEPS[stepIndex];
      current?.onLeave?.(apiRef.current, direction);
      const target = TOUR_STEPS[index];
      target?.onEnter?.(apiRef.current, direction);
      setStepIndex(index);
    },
    [stepIndex],
  );

  const next = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) goTo(stepIndex + 1, "next");
    else {
      TOUR_STEPS[stepIndex]?.onLeave?.(apiRef.current, "next");
      setPhase("finale");
    }
  }, [stepIndex, goTo]);

  const prev = useCallback(() => {
    if (stepIndex > 0) goTo(stepIndex - 1, "prev");
  }, [stepIndex, goTo]);

  const backToTour = useCallback(() => setPhase("tour"), []);

  const skip = useCallback(() => {
    end(true);
    toast("Tutorial pulado. Dá para ver de novo em Ajustes.");
  }, [end]);

  const finish = useCallback(() => {
    setPhase("cleaning");
    window.setTimeout(() => {
      end(false);
      toast.success("Dados de exemplo apagados. Agora é com você! 💚");
    }, 1900);
  }, [end]);

  const dismissWelcome = useCallback(() => updateProfile({ tutorial: "skipped" }), [updateProfile]);

  const value = useMemo<TutorialValue>(
    () => ({
      running,
      phase,
      stepIndex,
      steps: TOUR_STEPS,
      step: TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0],
      welcomeVisible,
      start,
      next,
      prev,
      skip,
      finish,
      backToTour,
      dismissWelcome,
    }),
    [running, phase, stepIndex, welcomeVisible, start, next, prev, skip, finish, backToTour, dismissWelcome],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("useTutorial precisa estar dentro de <TutorialProvider>");
  return context;
}
