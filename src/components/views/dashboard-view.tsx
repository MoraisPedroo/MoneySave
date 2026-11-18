"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  CreditCard,
  Landmark,
  ReceiptText,
  Repeat,
  Scissors,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { bankChartColor, bankName } from "@/lib/banks";
import { cardOverview } from "@/lib/cards";
import { getCategory } from "@/lib/categories";
import {
  monthSummary,
  monthlyEquivalent,
  monthlyTrend,
  nextChargeDate,
  occurrencesInMonth,
  subscriptionBankSlug,
  txBankSlug,
  type MonthSummary,
} from "@/lib/finance";
import { addMonthsKey, daysUntil, formatBRL, formatDayMonth, formatPercent, monthKeyOf, monthName, relativeDue } from "@/lib/format";
import { goalPlan } from "@/lib/goals";
import type { Transaction } from "@/lib/types";
import { cn, roundMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState, Progress, Skeleton } from "@/components/ui/misc";
import { BankLogo } from "@/components/bank/bank-logo";
import { ServiceAvatar } from "@/components/bank/avatars";
import { DonutChart, TrendChart } from "@/components/charts/charts";
import { SetupChecklist } from "@/components/onboarding/setup-checklist";

export function DashboardView() {
  const { data, month, cuts, ready, sandbox, profile, isRealDataEmpty } = useFinance();
  const { open } = useDialogs();
  const summary = useMemo(() => monthSummary(data, month, cuts), [data, month, cuts]);
  const trend = useMemo(() => monthlyTrend(data, month, 6, cuts), [data, month, cuts]);

  if (!ready || !month) return <DashboardSkeleton />;

  const showChecklist = !sandbox && !profile.onboardingDone;
  if (!sandbox && isRealDataEmpty) {
    return (
      <div className="grid gap-4 lg:gap-6">
        {showChecklist ? (
          <SetupChecklist />
        ) : (
          <EmptyState
            icon={<Wallet />}
            title="Nada por aqui ainda"
            description="Lance seus gastos, contas e receitas para ver quanto sobra no mês."
            action={
              <Button onClick={() => open({ type: "transaction" })}>
                <ReceiptText /> Novo lançamento
              </Button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:gap-6">
      {showChecklist ? <SetupChecklist /> : null}
      <div className="grid gap-4 lg:gap-6 xl:grid-cols-3">
        <FreeHero summary={summary} className="xl:col-span-2" />
        <GoalsFitCard free={summary.free} />
      </div>

      {summary.free < 0 ? <NegativeDiagnosis summary={summary} /> : null}

      <StatGrid summary={summary} />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <CategoryBreakdown summary={summary} />
        <BankBreakdown summary={summary} />
      </div>

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Evolução dos últimos 6 meses</CardTitle>
              <CardDescription>Receitas, despesas e quanto sobrou em cada mês</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
        <UpcomingDue />
      </div>

      <CardsStrip />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FreeHero({ summary, className }: { summary: MonthSummary; className?: string }) {
  const { cuts, data } = useFinance();
  const negative = summary.free < 0;
  const noIncome = summary.income <= 0;
  const committed = summary.committed ?? 0;
  const savings = useMemo(() => {
    if (cuts.size === 0) return 0;
    return roundMoney(data.subscriptions.filter((s) => cuts.has(s.id) && s.active).reduce((acc, s) => acc + monthlyEquivalent(s), 0));
  }, [cuts, data.subscriptions]);

  return (
    <div
      data-tour="hero"
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 text-white shadow-lg sm:p-7",
        negative ? "bg-hero-negative shadow-rose-500/20" : "bg-hero-positive shadow-emerald-500/20",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -right-8 -bottom-24 size-44 rounded-full bg-black/10" />

      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-white/85">
          {negative ? <TriangleAlert className="size-4" /> : <Wallet className="size-4" />}
          {negative ? "Você está no vermelho em" : "Quanto sobra em"} {monthName(summary.month).toLowerCase()}
        </p>
        {cuts.size > 0 ? (
          <Link href="/assinaturas" className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm hover:bg-white/25">
            <Scissors className="size-3.5" /> Simulação: +{formatBRL(savings)}/mês
          </Link>
        ) : null}
      </div>

      <p className="money relative mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{formatBRL(summary.free)}</p>
      <p className="relative mt-1 text-sm text-white/85">
        {noIncome
          ? "Lance suas receitas (salário, extras) para calcular quanto sobra."
          : negative
            ? `Faltam ${formatBRL(-summary.free)} para fechar o mês — ${formatPercent(committed)} da renda já está comprometida.`
            : `Você ainda tem ${formatPercent(summary.free / summary.income)} da sua renda livre este mês.`}
      </p>

      {!noIncome ? (
        <div className="relative mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-white/80">
            <span>Renda comprometida</span>
            <span className="money font-semibold text-white">{formatPercent(committed)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${Math.min(100, committed * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <HeroChip label="Receitas" value={summary.income} icon={<TrendingUp className="size-3.5" />} />
        <HeroChip label="Gastos e contas" value={summary.daily + summary.bills} icon={<ReceiptText className="size-3.5" />} />
        <HeroChip label="Cartões" value={summary.cards} icon={<CreditCard className="size-3.5" />} />
        <HeroChip label="Assinaturas" value={summary.subscriptions} icon={<Repeat className="size-3.5" />} />
      </div>
    </div>
  );
}

function HeroChip({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/12 px-3 py-2.5 backdrop-blur-sm">
      <p className="flex items-center gap-1.5 text-[11px] text-white/80">
        {icon}
        {label}
      </p>
      <p className="money mt-0.5 text-sm font-semibold sm:text-base">{formatBRL(value)}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GoalsFitCard({ free }: { free: number }) {
  const { data, today } = useFinance();
  const { open } = useDialogs();
  const plans = useMemo(
    () =>
      data.goals
        .map((goal) => ({ goal, plan: goalPlan(goal, today) }))
        .sort((a, b) => Number(a.plan.done) - Number(b.plan.done) || a.goal.targetDate.localeCompare(b.goal.targetDate)),
    [data.goals, today],
  );
  const activePlans = plans.filter((p) => !p.plan.done);
  const totalPerMonth = roundMoney(activePlans.reduce((acc, p) => acc + p.plan.perMonth, 0));
  const fits = free >= totalPerMonth;
  const left = roundMoney(free - totalPerMonth);

  return (
    <Card className="flex flex-col" data-tour="goals-fit">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-primary" /> Cabe nas suas metas?
          </CardTitle>
          <CardDescription>Quanto guardar por mês vs. quanto sobra</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {plans.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-3">
            <p className="text-sm text-muted-foreground">Crie um objetivo (reserva, viagem, quitar uma dívida) e veja o valor certo para guardar todo mês.</p>
            <Button variant="soft" onClick={() => open({ type: "goal" })}>
              <Target /> Criar objetivo
            </Button>
          </div>
        ) : (
          <>
            <div className={cn("rounded-2xl p-3.5", fits ? "bg-success-soft" : "bg-warning-soft")}>
              <p className={cn("flex items-center gap-1.5 text-sm font-semibold", fits ? "text-success" : "text-warning")}>
                {fits ? <CircleCheck className="size-4" /> : <CircleAlert className="size-4" />}
                {activePlans.length === 0 ? "Todas as metas concluídas! 🎉" : fits ? "Sim, cabe no orçamento" : "Ainda não cabe"}
              </p>
              {activePlans.length > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Guardar <strong className="money text-foreground">{formatBRL(totalPerMonth)}/mês</strong>
                  {fits ? (
                    <>
                      {" "}e ainda sobram <strong className="money text-foreground">{formatBRL(left)}</strong>.
                    </>
                  ) : (
                    <>
                      {" "}— faltam <strong className="money text-foreground">{formatBRL(-left)}</strong> por mês.
                    </>
                  )}
                </p>
              ) : null}
            </div>
            <ul className="grid gap-3">
              {plans.slice(0, 3).map(({ goal, plan }) => (
                <li key={goal.id} className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <span aria-hidden>{goal.icon}</span>
                      <span className="truncate">{goal.title}</span>
                    </span>
                    <span className="money shrink-0 text-xs text-muted-foreground">
                      {plan.done ? "Concluída" : `${formatBRL(plan.perMonth)}/mês`}
                    </span>
                  </div>
                  <Progress value={plan.progress * 100} color={goal.color} />
                </li>
              ))}
            </ul>
            <Button asChild variant="ghost" size="sm" className="mt-auto self-start">
              <Link href="/objetivos">
                Ver objetivos <ArrowRight />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function NegativeDiagnosis({ summary }: { summary: MonthSummary }) {
  const { data, cuts, toggleCut } = useFinance();
  const topCards = summary.byCard
    .map((entry) => ({ ...entry, card: data.cards.find((c) => c.id === entry.cardId) }))
    .filter((entry) => entry.card)
    .slice(0, 3);

  return (
    <Card className="border-destructive/30 bg-destructive-soft/60">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-4" /> Diagnóstico: o que está pesando
          </CardTitle>
          <CardDescription>
            {summary.committed !== null
              ? `Suas despesas somam ${formatPercent(summary.committed)} da renda do mês. Veja onde dá para cortar:`
              : "Não há receitas lançadas neste mês. Veja as maiores despesas:"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Maiores gastos para revisar</p>
          {summary.topExpenses.slice(0, 3).map((item) => (
            <div key={`${item.kind}:${item.id}`} className="flex items-center gap-3 rounded-xl bg-card p-2.5">
              {item.kind === "sub" ? (
                <ServiceAvatar subscription={data.subscriptions.find((s) => s.id === item.id) ?? { name: item.label, category: "outros", serviceSlug: null }} size={34} />
              ) : (
                <BankLogo slug={item.bankSlug} size={34} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span className="money text-sm font-semibold">{formatBRL(item.amount)}</span>
              {item.kind === "sub" ? (
                <Button size="sm" variant="outline" onClick={() => toggleCut(item.id)}>
                  <Scissors /> {cuts.has(item.id) ? "Desfazer" : "Simular corte"}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="grid content-start gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Cartões que mais pesam</p>
          {topCards.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum gasto no cartão neste mês.</p> : null}
          {topCards.map(({ card, amount }) => (
            <div key={card!.id} className="flex items-center gap-3 rounded-xl bg-card p-2.5">
              <BankLogo slug={card!.bankSlug} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{card!.name}</p>
                <p className="text-xs text-muted-foreground">{summary.expenses > 0 ? formatPercent(amount / summary.expenses) : "—"} das despesas</p>
              </div>
              <span className="money text-sm font-semibold">{formatBRL(amount)}</span>
            </div>
          ))}
          <Button asChild variant="outline" size="sm" className="mt-1 self-start">
            <Link href="/assinaturas">
              <Scissors /> Abrir radar de assinaturas
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function StatGrid({ summary }: { summary: MonthSummary }) {
  const items = [
    { label: "Receitas", value: summary.income, caption: "Salário, extras e outras entradas", icon: TrendingUp, tone: "text-success bg-success-soft", href: "/lancamentos" },
    { label: "Gastos no Pix/débito", value: summary.daily, caption: "Gastos diários fora do cartão", icon: TrendingDown, tone: "text-destructive bg-destructive-soft", href: "/lancamentos" },
    {
      label: "Contas gerais",
      value: summary.bills,
      caption: summary.pendingBillsCount ? `${summary.pendingBillsCount} pendente(s) · ${formatBRL(summary.pendingBills)}` : "Tudo pago 👌",
      icon: Landmark,
      tone: "text-warning bg-warning-soft",
      href: "/lancamentos",
    },
    { label: "Cartões de crédito", value: summary.cards, caption: "Compras e parcelas do mês", icon: CreditCard, tone: "text-chart-2 bg-chart-2/12", href: "/cartoes" },
    { label: "Assinaturas", value: summary.subscriptions, caption: `${summary.activeSubscriptions.length} ativa(s) · equivalente mensal`, icon: Repeat, tone: "text-chart-5 bg-chart-5/12", href: "/assinaturas" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-2xl border bg-card p-4 shadow-xs transition-colors hover:border-primary/30 last:col-span-2 sm:last:col-span-1"
          >
            <span className={cn("mb-3 flex size-9 items-center justify-center rounded-xl", item.tone)}>
              <Icon className="size-[18px]" />
            </span>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="money mt-0.5 text-lg font-semibold">{formatBRL(item.value)}</p>
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{item.caption}</p>
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CategoryBreakdown({ summary }: { summary: MonthSummary }) {
  const top = summary.byCategory.slice(0, 5);
  const restTotal = roundMoney(summary.byCategory.slice(5).reduce((acc, c) => acc + c.amount, 0));
  const slices = [
    ...top.map((c) => ({ name: c.label, value: c.amount, color: c.color })),
    ...(restTotal > 0 ? [{ name: "Outras", value: restTotal, color: "#94a3b8" }] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Para onde vai o dinheiro</CardTitle>
          <CardDescription>Despesas do mês por categoria</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
        ) : (
          <div className="grid items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[180px_minmax(0,1fr)]">
            <DonutChart data={slices} total={summary.expenses} label="Despesas" />
            <ul className="grid gap-2.5">
              {slices.map((slice) => (
                <li key={slice.name} className="grid gap-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="truncate">{slice.name}</span>
                    </span>
                    <span className="money shrink-0 font-medium">
                      {formatBRL(slice.value)}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {summary.expenses > 0 ? formatPercent(slice.value / summary.expenses) : ""}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BankBreakdown({ summary }: { summary: MonthSummary }) {
  const max = summary.byBank[0]?.amount ?? 0;
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Gastos por banco</CardTitle>
          <CardDescription>Cartões, contas e assinaturas de cada instituição</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {summary.byBank.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum gasto neste mês.</p>
        ) : (
          <ul className="grid gap-3.5">
            {summary.byBank.slice(0, 6).map((entry) => (
              <li key={entry.slug} className="flex items-center gap-3">
                <BankLogo slug={entry.slug} size={34} />
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{bankName(entry.slug)}</span>
                    <span className="money shrink-0 font-semibold">{formatBRL(entry.amount)}</span>
                  </div>
                  <Progress value={max > 0 ? (entry.amount / max) * 100 : 0} color={bankChartColor(entry.slug)} className="h-2.5" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

interface DueItem {
  key: string;
  date: string;
  label: string;
  detail: string;
  amount: number;
  slug: string;
  kind: "conta" | "fatura" | "assinatura";
  tx?: Transaction;
  month?: string;
}

function UpcomingDue() {
  const { data, today, save } = useFinance();
  const { open } = useDialogs();

  const items = useMemo<DueItem[]>(() => {
    if (!today) return [];
    const thisMonth = monthKeyOf(today);
    const list: DueItem[] = [];
    for (const m of [addMonthsKey(thisMonth, -1), thisMonth, addMonthsKey(thisMonth, 1)]) {
      for (const occ of occurrencesInMonth(data.transactions, m)) {
        if (occ.tx.type !== "conta_geral" || occ.isPaid || occ.tx.paymentMethod === "cartao") continue;
        const diff = daysUntil(occ.date, today);
        if (diff > 30 || diff < -45) continue;
        list.push({
          key: occ.key,
          date: occ.date,
          label: occ.tx.description,
          detail: getCategory(occ.tx.type, occ.tx.category).label,
          amount: occ.amount,
          slug: txBankSlug(occ.tx, data),
          kind: "conta",
          tx: occ.tx,
          month: m,
        });
      }
    }
    for (const card of data.cards) {
      const overview = cardOverview(card, data.transactions, data.subscriptions, today);
      const inv = overview.nextDue;
      if (inv.total > 0 && daysUntil(inv.dueDate, today) <= 30) {
        list.push({ key: `fatura:${card.id}`, date: inv.dueDate, label: `Fatura ${card.name}`, detail: `Fecha ${formatDayMonth(inv.closingDate)}`, amount: inv.total, slug: card.bankSlug, kind: "fatura" });
      }
    }
    for (const sub of data.subscriptions) {
      if (!sub.active) continue;
      const date = nextChargeDate(sub, today);
      if (daysUntil(date, today) <= 7) {
        list.push({ key: `sub:${sub.id}`, date, label: sub.name, detail: "Assinatura", amount: sub.amount, slug: subscriptionBankSlug(sub, data), kind: "assinatura" });
      }
    }
    return list.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  }, [data, today]);

  const markPaid = (item: DueItem) => {
    if (!item.tx) return;
    const tx = item.tx;
    if (tx.recurring && item.month) {
      const paidMonths = [...new Set([...(tx.paidMonths ?? []), item.month])].sort();
      save("transactions", { ...tx, paidMonths });
    } else {
      save("transactions", { ...tx, isPaid: true });
    }
    toast.success(`"${tx.description}" marcada como paga.`);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Próximos vencimentos</CardTitle>
          <CardDescription>Contas, faturas e assinaturas nos próximos dias</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CircleCheck className="size-8 text-success" />
            <p className="text-sm text-muted-foreground">Nada vencendo nos próximos dias.</p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {items.map((item) => {
              const diff = daysUntil(item.date, today);
              const overdue = diff < 0 && item.kind === "conta";
              return (
                <li key={item.key} className="flex items-center gap-3 rounded-xl border p-2.5">
                  <BankLogo slug={item.slug} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant={overdue ? "destructive" : diff <= 3 ? "warning" : "secondary"}>
                        {overdue ? `Venceu ${relativeDue(item.date, today).toLowerCase()}` : relativeDue(item.date, today)}
                      </Badge>
                      <span className="truncate">{item.detail}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="money text-sm font-semibold">{formatBRL(item.amount)}</span>
                    {item.kind === "conta" ? (
                      <button type="button" className="text-[11px] font-medium text-primary hover:underline" onClick={() => markPaid(item)}>
                        Marcar paga
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => open({ type: "transaction", defaults: { type: "conta_geral", category: "moradia" } })}>
          <ReceiptText /> Lançar conta
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function CardsStrip() {
  const { data, today } = useFinance();
  const { open } = useDialogs();
  const overviews = useMemo(
    () => data.cards.map((card) => cardOverview(card, data.transactions, data.subscriptions, today)),
    [data.cards, data.transactions, data.subscriptions, today],
  );
  if (overviews.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Seus cartões</CardTitle>
          <CardDescription>Fatura aberta, vencimento e uso do limite</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/cartoes">
            Ver todos <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviews.map((ov) => (
          <button
            key={ov.card.id}
            type="button"
            onClick={() => open({ type: "card-details", cardId: ov.card.id })}
            className="grid gap-2.5 rounded-2xl border p-3.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
          >
            <div className="flex items-center gap-2.5">
              <BankLogo slug={ov.card.bankSlug} size={32} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{ov.card.name}</p>
                <p className="text-xs text-muted-foreground">Vence {formatDayMonth(ov.nextDue.dueDate)}</p>
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted-foreground">Próxima fatura</span>
              <span className="money font-semibold">{formatBRL(ov.nextDue.total)}</span>
            </div>
            <Progress
              value={ov.usage * 100}
              indicatorClassName={ov.usage >= 0.8 ? "bg-destructive" : ov.usage >= 0.6 ? "bg-warning" : undefined}
              color={ov.usage < 0.6 ? bankChartColor(ov.card.bankSlug) : undefined}
            />
            <p className="text-[11px] text-muted-foreground">
              {formatPercent(ov.usage)} do limite usado
              {ov.usage >= 0.8 ? <span className="font-medium text-destructive"> · alerta</span> : null}
            </p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:gap-6">
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Skeleton className="h-64 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
