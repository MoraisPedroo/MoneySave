"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CircleAlert, CircleCheck, Calculator, Pencil, Plus, Target, Trophy } from "lucide-react";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { monthSummary } from "@/lib/finance";
import { formatBRL, formatDateBR, monthLabel, monthName } from "@/lib/format";
import { PRIORITY_LABEL, goalPlan, simulateMonthly, type GoalPlan } from "@/lib/goals";
import type { Goal } from "@/lib/types";
import { cn, roundMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { MoneyInput } from "@/components/ui/money-input";

const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 } as const;

export function GoalsView() {
  const { data, month, today, cuts, ready } = useFinance();
  const { open } = useDialogs();
  const free = useMemo(() => (month ? monthSummary(data, month, cuts).free : 0), [data, month, cuts]);

  const items = useMemo(
    () =>
      data.goals
        .map((goal) => ({ goal, plan: goalPlan(goal, today) }))
        .sort(
          (a, b) =>
            Number(a.plan.done) - Number(b.plan.done) ||
            PRIORITY_ORDER[a.goal.priority] - PRIORITY_ORDER[b.goal.priority] ||
            a.goal.targetDate.localeCompare(b.goal.targetDate),
        ),
    [data.goals, today],
  );

  if (!ready || !month) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const active = items.filter((i) => !i.plan.done);
  const totalPerMonth = roundMoney(active.reduce((acc, i) => acc + i.plan.perMonth, 0));
  const fits = free >= totalPerMonth;
  const afterGoals = roundMoney(free - totalPerMonth);
  const totalSaved = roundMoney(data.goals.reduce((acc, g) => acc + g.currentAmount, 0));

  return (
    <div className="grid gap-4 lg:gap-6">
      {items.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className={cn("flex items-start gap-3 rounded-2xl border p-4", fits ? "border-success/30 bg-success-soft/60" : "border-warning/40 bg-warning-soft/60")}>
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", fits ? "bg-success text-white" : "bg-warning text-white")}>
              {fits ? <CircleCheck className="size-5" /> : <CircleAlert className="size-5" />}
            </span>
            <div>
              <p className="font-semibold">
                {active.length === 0
                  ? "Todas as metas foram alcançadas! 🎉"
                  : fits
                    ? "Suas metas cabem no orçamento"
                    : "Suas metas ainda não cabem no orçamento"}
              </p>
              <p className="text-sm text-muted-foreground">
                Sobra em {monthName(month).toLowerCase()}: <strong className="money text-foreground">{formatBRL(free)}</strong> · metas pedem{" "}
                <strong className="money text-foreground">{formatBRL(totalPerMonth)}/mês</strong>.{" "}
                {active.length > 0
                  ? fits
                    ? `Depois de guardar, ainda ficam ${formatBRL(afterGoals)}.`
                    : `Faltam ${formatBRL(-afterGoals)} por mês — corte assinaturas ou estenda os prazos.`
                  : ""}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-xs">
            <p className="text-xs text-muted-foreground">Total guardado</p>
            <p className="money mt-1 text-xl font-semibold">{formatBRL(totalSaved)}</p>
            <p className="text-[11px] text-muted-foreground">em {data.goals.length} objetivo(s)</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-xs">
            <p className="text-xs text-muted-foreground">Guardar por mês (todas)</p>
            <p className="money mt-1 text-xl font-semibold">{formatBRL(totalPerMonth)}</p>
            <p className="text-[11px] text-muted-foreground">{active.length} meta(s) em andamento</p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Seus objetivos</h2>
        <Button onClick={() => open({ type: "goal" })} data-tour="add-goal">
          <Plus /> Novo objetivo
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Target />}
          title="Nenhum objetivo ainda"
          description="Reserva de emergência, viagem, carro, quitar o cartão… diga o valor e a data e veja quanto guardar por mês, semana e dia."
          action={
            <Button onClick={() => open({ type: "goal" })}>
              <Plus /> Criar primeiro objetivo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ goal, plan }, index) => (
            <GoalCard key={goal.id} goal={goal} plan={plan} free={free} tourTarget={index === 0 ? "goal-card" : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressRing({ value, color, size = 76 }: { value: number; color: string; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, value)))}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

function GoalCard({ goal, plan, free, tourTarget }: { goal: Goal; plan: GoalPlan; free: number; tourTarget?: string }) {
  const { today } = useFinance();
  const { open } = useDialogs();
  const [simOpen, setSimOpen] = useState(false);
  const [monthly, setMonthly] = useState(plan.perMonth);
  const simulation = simulateMonthly(goal, monthly, today);
  const fitsAlone = plan.perMonth <= Math.max(0, free);

  return (
    <Card className={cn("flex flex-col overflow-hidden", plan.done && "border-success/40")} data-tour={tourTarget}>
      <div className="h-1.5" style={{ backgroundColor: goal.color }} />
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${goal.color}22` }} aria-hidden>
            {goal.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{goal.title}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="secondary">Prioridade {PRIORITY_LABEL[goal.priority].toLowerCase()}</Badge>
              {plan.done ? (
                <Badge variant="success">
                  <Trophy /> Concluída
                </Badge>
              ) : plan.overdue ? (
                <Badge variant="destructive">Prazo vencido</Badge>
              ) : (
                <Badge variant={fitsAlone ? "success" : "warning"}>{fitsAlone ? "Cabe no orçamento" : "Aperta o orçamento"}</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => open({ type: "goal", goal })} aria-label={`Editar ${goal.title}`}>
            <Pencil />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <ProgressRing value={plan.progress} color={goal.color} />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{Math.round(plan.progress * 100)}%</span>
          </div>
          <div className="grid flex-1 gap-1 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Guardado</span>
              <span className="money font-semibold">{formatBRL(goal.currentAmount)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Meta</span>
              <span className="money font-medium">{formatBRL(goal.targetAmount)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Falta</span>
              <span className="money font-medium">{formatBRL(plan.remaining)}</span>
            </div>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" /> Até {formatDateBR(goal.targetDate)}
          {!plan.done && plan.daysLeft >= 0 ? ` · ${plan.daysLeft} dias (${plan.monthsLeft} ${plan.monthsLeft === 1 ? "mês" : "meses"})` : ""}
        </p>

        {!plan.done ? (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-2.5 text-center">
            <div>
              <p className="text-[11px] text-muted-foreground">Por mês</p>
              <p className="money text-sm font-semibold">{formatBRL(plan.perMonth)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Por semana</p>
              <p className="money text-sm font-semibold">{formatBRL(plan.perWeek)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Por dia</p>
              <p className="money text-sm font-semibold">{formatBRL(plan.perDay)}</p>
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-success-soft p-3 text-center text-sm font-medium text-success">Parabéns, você chegou lá! 🎉</p>
        )}

        {simOpen && !plan.done ? (
          <div className="grid gap-2 rounded-xl border p-3">
            <p className="text-xs font-medium text-muted-foreground">E se eu guardar por mês…</p>
            <MoneyInput value={monthly} onChange={setMonthly} aria-label="Valor mensal simulado" />
            <p className="text-sm">
              {simulation ? (
                <>
                  Você chega lá em <strong>{simulation.months} {simulation.months === 1 ? "mês" : "meses"}</strong> ({monthLabel(simulation.date.slice(0, 7)).toLowerCase()})
                  {simulation.date > goal.targetDate ? <span className="text-warning"> — depois do prazo.</span> : <span className="text-success"> — dentro do prazo!</span>}
                </>
              ) : (
                <span className="text-muted-foreground">Informe um valor mensal.</span>
              )}
            </p>
          </div>
        ) : null}

        <div className="mt-auto flex gap-2">
          <Button className="flex-1" onClick={() => open({ type: "deposit", goal })} style={{ backgroundColor: goal.color }}>
            <Plus /> Guardar
          </Button>
          {!plan.done ? (
            <Button variant="outline" onClick={() => setSimOpen((v) => !v)} aria-expanded={simOpen}>
              <Calculator /> Simular
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
