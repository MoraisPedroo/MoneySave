"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, CreditCard, Landmark, Minus, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { useTutorial } from "@/context/tutorial-context";
import { getSetupSteps, setupProgress } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SALARY_DEFAULTS } from "@/components/onboarding/setup-checklist";
import { Pet, type PetMood } from "./pet";

/**
 * Poupinho flutuante: acompanha o checklist de primeiros passos com dicas em balões.
 * Some de vez quando os 4 passos chegam a 100%.
 */
export function PetGuide() {
  const { ready, sandbox, profile, data, updateProfile, user } = useFinance();
  const { running, welcomeVisible } = useTutorial();
  const { open } = useDialogs();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ack, setAck] = useState<number | null>(null);

  const steps = getSetupSteps(data, profile.skippedSteps);
  const progress = setupProgress(steps);
  const visible = ready && !sandbox && !running && !welcomeVisible && !profile.onboardingDone;

  // guarda o progresso visto para comemorar só quando um passo novo é concluído
  if (visible && (ack === null || progress.completed < ack)) setAck(progress.completed);

  if (!visible) return null;

  const firstName = user?.name.split(" ")[0] ?? "";
  const justCompleted = ack !== null && progress.completed > ack;
  let mood: PetMood = "talk";
  let title = `Passo ${Math.min(progress.completed + 1, progress.total)} de ${progress.total}`;
  let message: React.ReactNode;
  let actions: React.ReactNode = null;

  if (progress.allDone) {
    mood = "happy";
    title = "100% concluído!";
    message = "Uhuul! Agora você já sabe usar o MoneySave. Vou descansar um pouco — se quiser rever tudo, o tutorial fica em Ajustes. 💚";
    actions = (
      <Button size="sm" onClick={() => updateProfile({ onboardingDone: true })}>
        Valeu, Poupinho!
      </Button>
    );
  } else if (justCompleted) {
    mood = "happy";
    title = `${progress.pct}% concluído`;
    message = `Boa${firstName ? `, ${firstName}` : ""}! Passo concluído ✅ Bora para o próximo?`;
    actions = (
      <Button size="sm" onClick={() => setAck(progress.completed)}>
        Próximo passo <ChevronRight />
      </Button>
    );
  } else if (progress.current?.id === "contas") {
    message =
      pathname === "/cartoes"
        ? "Toque em “Novo cartão”, escolha seu banco e informe o limite e os dias de fechamento e vencimento. Tem conta sem cartão? Use “Nova conta”."
        : `${firstName ? `Oi, ${firstName}! ` : ""}Primeiro, cadastre seus cartões e contas — assim eu sei de qual banco sai cada gasto.`;
    actions = (
      <>
        <Button size="sm" onClick={() => open({ type: "card" })}>
          <CreditCard /> Cartão
        </Button>
        <Button size="sm" variant="outline" onClick={() => open({ type: "account" })}>
          <Landmark /> Conta
        </Button>
      </>
    );
  } else if (progress.current?.id === "renda") {
    message = "Agora me conta quanto você ganha! Lance seu salário como receita fixa — ele vira a base do “Quanto sobra”.";
    actions = (
      <Button size="sm" onClick={() => open(SALARY_DEFAULTS)}>
        <Plus /> Lançar salário
      </Button>
    );
  } else if (progress.current?.id === "assinaturas") {
    message =
      pathname === "/assinaturas"
        ? "Toque em “Nova” e use os atalhos (Netflix, Spotify, Prime…). Eu somo quanto cada cartão gasta por mês."
        : "Netflix, Spotify, academia… cadastre suas assinaturas e eu mostro quanto cada cartão gasta com elas.";
    actions = (
      <>
        <Button size="sm" onClick={() => open({ type: "subscription" })}>
          <Plus /> Assinatura
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            updateProfile({ skippedSteps: [...new Set([...profile.skippedSteps, "assinaturas"])] });
            toast.success("Tudo bem! Dá para cadastrar depois.");
          }}
        >
          Não tenho
        </Button>
      </>
    );
  } else {
    message = "Último passo! Crie um objetivo — reserva, viagem, celular novo — e eu calculo quanto guardar por mês, semana e dia.";
    actions = (
      <Button size="sm" onClick={() => open({ type: "goal" })}>
        <Target /> Criar objetivo
      </Button>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 z-40 flex flex-col items-start gap-1.5 lg:right-6 lg:bottom-6 lg:left-auto lg:items-end">
      {!collapsed ? (
        <div
          key={`${title}-${message}`}
          className="pointer-events-auto relative w-[min(20rem,calc(100vw-1.5rem))] animate-pop-in rounded-2xl border bg-popover p-3.5 text-sm text-popover-foreground shadow-xl"
        >
          <span className="absolute -bottom-2 left-7 size-4 rotate-45 border-r border-b bg-popover lg:right-7 lg:left-auto" aria-hidden />
          <div className="relative">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-primary">Poupinho · {title}</p>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Minimizar o Poupinho"
              >
                <Minus className="size-3.5" />
              </button>
            </div>
            <p className="leading-snug">{message}</p>
            {!progress.allDone ? (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress.pct}%` }} />
                </div>
                <span className="money text-[11px] font-semibold text-muted-foreground">{progress.pct}%</span>
              </div>
            ) : null}
            {actions ? <div className="mt-3 flex flex-wrap gap-1.5">{actions}</div> : null}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className={cn("pointer-events-auto relative rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", collapsed && "opacity-90")}
        aria-label={collapsed ? "Abrir as dicas do Poupinho" : "Minimizar o Poupinho"}
      >
        <Pet size={58} mood={mood} />
        {collapsed ? (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow">
            !
          </span>
        ) : null}
      </button>
    </div>
  );
}
