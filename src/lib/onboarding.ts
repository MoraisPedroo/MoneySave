import type { FinanceData } from "./types";

export type SetupStepId = "contas" | "renda" | "assinaturas" | "objetivo";

export interface SetupStep {
  id: SetupStepId;
  title: string;
  description: string;
  done: boolean;
  skipped: boolean;
  canSkip: boolean;
}

const META: { id: SetupStepId; title: string; description: string; canSkip: boolean }[] = [
  {
    id: "contas",
    title: "Cadastre seus cartões e contas",
    description: "Nubank, Inter, PicPay, Sicoob… com limite, fechamento e vencimento.",
    canSkip: false,
  },
  {
    id: "renda",
    title: "Lance seu salário",
    description: "Sua renda como receita fixa: é a base do “Quanto sobra”.",
    canSkip: false,
  },
  {
    id: "assinaturas",
    title: "Cadastre suas assinaturas",
    description: "Netflix, Spotify, academia… veja quanto cada cartão gasta com elas.",
    canSkip: true,
  },
  {
    id: "objetivo",
    title: "Crie seu primeiro objetivo",
    description: "Reserva, viagem, celular novo: saiba quanto guardar por mês.",
    canSkip: false,
  },
];

/** Passos de configuração inicial, concluídos automaticamente conforme os dados cadastrados. */
export function getSetupSteps(data: FinanceData, skipped: readonly string[]): SetupStep[] {
  return META.map((meta) => {
    const done =
      meta.id === "contas"
        ? data.cards.length + data.accounts.length > 0
        : meta.id === "renda"
          ? data.transactions.some((t) => t.type === "receita")
          : meta.id === "assinaturas"
            ? data.subscriptions.length > 0
            : data.goals.length > 0;
    return { ...meta, done, skipped: !done && skipped.includes(meta.id) };
  });
}

export function setupProgress(steps: SetupStep[]) {
  const completed = steps.filter((step) => step.done || step.skipped).length;
  return {
    completed,
    total: steps.length,
    pct: Math.round((completed / steps.length) * 100),
    allDone: completed === steps.length,
    current: steps.find((step) => !step.done && !step.skipped) ?? null,
    currentIndex: steps.findIndex((step) => !step.done && !step.skipped),
  };
}
