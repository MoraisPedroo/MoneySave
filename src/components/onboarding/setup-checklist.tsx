"use client";

import { Check, CreditCard, Landmark, PartyPopper, Plus, Repeat, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs, type DialogRequest } from "@/context/dialogs-context";
import { getSetupSteps, setupProgress, type SetupStepId } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { Pet } from "@/components/pet/pet";

const ICONS: Record<SetupStepId, typeof CreditCard> = {
  contas: CreditCard,
  renda: TrendingUp,
  assinaturas: Repeat,
  objetivo: Target,
};

export const SALARY_DEFAULTS: DialogRequest = {
  type: "transaction",
  defaults: { type: "receita", category: "salario", description: "Salário", recurring: true },
};

/** Checklist de primeiros passos: vai de 0% a 100% conforme a pessoa cadastra os dados. */
export function SetupChecklist() {
  const { data, profile, updateProfile, user } = useFinance();
  const { open } = useDialogs();
  const steps = getSetupSteps(data, profile.skippedSteps);
  const progress = setupProgress(steps);
  const firstName = user?.name.split(" ")[0] ?? "";

  const skip = (id: SetupStepId) => {
    updateProfile({ skippedSteps: [...new Set([...profile.skippedSteps, id])] });
    toast.success("Passo pulado. Dá para cadastrar depois quando quiser.");
  };

  const actions: Record<SetupStepId, React.ReactNode> = {
    contas: (
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" onClick={() => open({ type: "card" })}>
          <CreditCard /> Cartão
        </Button>
        <Button size="sm" variant="outline" onClick={() => open({ type: "account" })}>
          <Landmark /> Conta
        </Button>
      </div>
    ),
    renda: (
      <Button size="sm" onClick={() => open(SALARY_DEFAULTS)}>
        <Plus /> Lançar salário
      </Button>
    ),
    assinaturas: (
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" onClick={() => open({ type: "subscription" })}>
          <Plus /> Assinatura
        </Button>
        <Button size="sm" variant="ghost" onClick={() => skip("assinaturas")}>
          Não tenho
        </Button>
      </div>
    ),
    objetivo: (
      <Button size="sm" onClick={() => open({ type: "goal" })}>
        <Target /> Criar objetivo
      </Button>
    ),
  };

  return (
    <Card className="overflow-hidden border-primary/25" data-tour="checklist">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-accent/80 via-accent/40 to-transparent p-5 sm:flex-row sm:items-center">
        <Pet size={58} mood={progress.allDone ? "happy" : "idle"} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold tracking-tight">
            {progress.allDone ? "Tudo pronto! 🎉" : `${firstName ? `${firstName}, vamos` : "Vamos"} configurar seu MoneySave`}
          </p>
          <p className="text-sm text-muted-foreground">
            {progress.allDone
              ? "Você concluiu todos os passos. Agora é só lançar seus gastos do dia a dia."
              : "Complete os 4 passos para o app calcular quanto sobra e quanto guardar."}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progress.pct} className="h-2.5" />
            <span className="money shrink-0 text-sm font-semibold text-primary">{progress.pct}%</span>
          </div>
        </div>
        {progress.allDone ? (
          <Button onClick={() => updateProfile({ onboardingDone: true })}>
            <PartyPopper /> Concluir
          </Button>
        ) : null}
      </div>

      <ol className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = ICONS[step.id];
          const finished = step.done || step.skipped;
          const current = progress.current?.id === step.id;
          return (
            <li key={step.id} className={cn("flex flex-col gap-3 bg-card p-4", current && "bg-accent/30")}>
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                    finished ? "border-success bg-success text-white" : current ? "border-primary text-primary" : "text-muted-foreground",
                  )}
                >
                  {finished ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p className={cn("flex items-center gap-1.5 text-sm font-semibold", finished && "text-muted-foreground line-through")}>
                    <Icon className="size-4 shrink-0" /> {step.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.skipped ? "Pulado — dá para fazer depois." : step.description}</p>
                </div>
              </div>
              {!finished ? <div className="mt-auto pl-12">{actions[step.id]}</div> : null}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
