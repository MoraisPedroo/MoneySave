"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ChevronDown, CreditCard, Landmark, Pencil, Plus, Repeat, RotateCcw, Scissors, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { bankName } from "@/lib/banks";
import { getSubscriptionCategory } from "@/lib/categories";
import { CYCLE_LABEL, monthSummary, monthlyEquivalent, nextChargeDate, subscriptionBankSlug, subscriptionTotals } from "@/lib/finance";
import { formatBRL, formatDayMonth, monthName, relativeDue, daysUntil } from "@/lib/format";
import type { Subscription } from "@/lib/types";
import { cn, roundMoney, sumBy } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState, Skeleton, Switch } from "@/components/ui/misc";
import { BankLogo } from "@/components/bank/bank-logo";
import { ServiceAvatar } from "@/components/bank/avatars";

const EMPTY = new Set<string>();

export function SubscriptionsView() {
  const { data, month, today, cuts, toggleCut, clearCuts, save, ready } = useFinance();
  const { open, confirm } = useDialogs();
  const [showInactive, setShowInactive] = useState(false);

  const active = useMemo(() => data.subscriptions.filter((s) => s.active).sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a)), [data.subscriptions]);
  const inactive = useMemo(() => data.subscriptions.filter((s) => !s.active), [data.subscriptions]);
  const totals = useMemo(() => subscriptionTotals(data.subscriptions), [data.subscriptions]);
  const savings = useMemo(() => roundMoney(sumBy(active.filter((s) => cuts.has(s.id)), monthlyEquivalent)), [active, cuts]);
  const freeBefore = useMemo(() => (month ? monthSummary(data, month, EMPTY).free : 0), [data, month]);
  const freeAfter = useMemo(() => (month ? monthSummary(data, month, cuts).free : 0), [data, month, cuts]);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; slug: string; items: Subscription[] }>();
    for (const sub of active) {
      const card = sub.paymentMethod === "cartao" ? data.cards.find((c) => c.id === sub.cardId) : undefined;
      const slug = subscriptionBankSlug(sub, data);
      const key = card ? `card:${card.id}` : `bank:${slug}`;
      const label = card ? card.name : `Débito · ${bankName(slug)}`;
      const group = map.get(key) ?? { key, label, slug, items: [] };
      group.items.push(sub);
      map.set(key, group);
    }
    return [...map.values()]
      .map((g) => ({ ...g, monthly: sumBy(g.items.filter((s) => !cuts.has(s.id)), monthlyEquivalent) }))
      .sort((a, b) => b.monthly - a.monthly);
  }, [active, data, cuts]);

  const cancelForReal = () => {
    const targets = active.filter((s) => cuts.has(s.id));
    confirm({
      title: `Marcar ${targets.length} assinatura(s) como canceladas?`,
      description: `${targets.map((s) => s.name).join(", ")} sairão do orçamento. Lembre-se de cancelar também no app de cada serviço.`,
      confirmLabel: "Marcar como canceladas",
      onConfirm: () => {
        targets.forEach((s) => save("subscriptions", { ...s, active: false }));
        clearCuts();
        toast.success(`Economia de ${formatBRL(savings)}/mês garantida! 💚`);
      },
    });
  };

  if (!ready || !month) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Total por mês" value={formatBRL(totals.monthly)} caption="Equivalente mensal das ativas" />
        <Tile label="Total por ano" value={formatBRL(totals.yearly)} caption="Quanto vai embora em 12 meses" />
        <Tile label="Assinaturas ativas" value={String(totals.count)} caption={inactive.length ? `${inactive.length} cancelada(s)` : "Nenhuma cancelada"} />
        <Tile
          label="Economia simulada"
          value={formatBRL(savings)}
          caption={savings > 0 ? `${formatBRL(savings * 12)} por ano` : "Use “Simular corte”"}
          highlight={savings > 0}
        />
      </div>

      {cuts.size > 0 ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-accent/60 p-4 sm:flex-row sm:items-center" data-tour="cut-banner">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scissors className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">
              Cortando {cuts.size} assinatura(s) você economiza <span className="money">{formatBRL(savings)}/mês</span>
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              Quanto sobra em {monthName(month).toLowerCase()}:
              <span className={cn("money font-medium", freeBefore < 0 ? "text-destructive" : "text-foreground")}>{formatBRL(freeBefore)}</span>
              <ArrowRight className="size-3.5" />
              <span className={cn("money font-semibold", freeAfter < 0 ? "text-destructive" : "text-success")}>{formatBRL(freeAfter)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={clearCuts}>
              <RotateCcw /> Limpar
            </Button>
            <Button onClick={cancelForReal}>Cancelar de verdade</Button>
          </div>
        </div>
      ) : null}

      {active.length === 0 && inactive.length === 0 ? (
        <EmptyState
          icon={<Repeat />}
          title="Nenhuma assinatura no radar"
          description="Cadastre Netflix, Spotify, Prime, academia, apps… e veja quanto cada cartão gasta por mês com elas."
          action={
            <Button onClick={() => open({ type: "subscription" })}>
              <Plus /> Adicionar assinatura
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <div>
                <CardTitle>Por cartão e banco</CardTitle>
                <CardDescription>Onde as assinaturas estão sendo cobradas</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              {groups.map((group) => (
                <div key={group.key} className="flex items-center gap-3 rounded-xl border p-3">
                  <BankLogo slug={group.slug} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {group.key.startsWith("card:") ? `No ${group.label}` : group.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{group.items.length} assinatura(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="money text-sm font-semibold">{formatBRL(group.monthly)}</p>
                    <p className="text-[11px] text-muted-foreground">por mês</p>
                  </div>
                </div>
              ))}
              {groups.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa.</p> : null}
            </CardContent>
          </Card>

          <Card className="overflow-hidden" data-tour="sub-list">
            <CardHeader className="border-b pb-4">
              <div>
                <CardTitle>Assinaturas ativas</CardTitle>
                <CardDescription>Ligue “Simular corte” para ver quanto passa a sobrar no mês</CardDescription>
              </div>
              <Button size="sm" onClick={() => open({ type: "subscription" })}>
                <Plus /> Nova
              </Button>
            </CardHeader>
            <ul className="divide-y">
              {active.map((sub) => (
                <SubscriptionRow key={sub.id} subscription={sub} cut={cuts.has(sub.id)} onToggleCut={() => toggleCut(sub.id)} today={today} />
              ))}
            </ul>
            {inactive.length ? (
              <div className="border-t">
                <button
                  type="button"
                  onClick={() => setShowInactive((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/40"
                >
                  Canceladas ({inactive.length})
                  <ChevronDown className={cn("size-4 transition-transform", showInactive && "rotate-180")} />
                </button>
                {showInactive ? (
                  <ul className="divide-y border-t">
                    {inactive.map((sub) => (
                      <li key={sub.id} className="flex items-center gap-3 px-5 py-3 opacity-70">
                        <ServiceAvatar subscription={sub} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium line-through">{sub.name}</p>
                          <p className="money text-xs text-muted-foreground">
                            {formatBRL(sub.amount)} · {CYCLE_LABEL[sub.billingCycle].toLowerCase()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            save("subscriptions", { ...sub, active: true });
                            toast.success(`${sub.name} reativada.`);
                          }}
                        >
                          <RotateCcw /> Reativar
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {active.length > 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" /> Assinaturas anuais entram no orçamento como 1/12 por mês (equivalente mensal).
        </p>
      ) : null}
    </div>
  );
}

function SubscriptionRow({
  subscription: sub,
  cut,
  onToggleCut,
  today,
}: {
  subscription: Subscription;
  cut: boolean;
  onToggleCut: () => void;
  today: string;
}) {
  const { data } = useFinance();
  const { open } = useDialogs();
  const category = getSubscriptionCategory(sub.category);
  const card = sub.paymentMethod === "cartao" ? data.cards.find((c) => c.id === sub.cardId) : undefined;
  const slug = subscriptionBankSlug(sub, data);
  const next = nextChargeDate(sub, today);
  const soon = daysUntil(next, today) <= 3;
  const monthly = monthlyEquivalent(sub);

  return (
    <li className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors sm:flex-nowrap", cut && "bg-muted/50")}>
      <button type="button" className="group flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => open({ type: "subscription", subscription: sub })}>
        <ServiceAvatar subscription={sub} size={42} className={cn(cut && "grayscale")} />
        <div className="min-w-0 flex-1">
          <p className={cn("flex items-center gap-2 truncate text-sm font-semibold", cut && "text-muted-foreground line-through")}>
            {sub.name}
            <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{category.label}</span>
            <span className="inline-flex items-center gap-1">
              {card ? <CreditCard className="size-3" /> : <Landmark className="size-3" />}
              <BankLogo slug={slug} size={14} shape="circle" />
              {card ? card.name : bankName(slug)}
            </span>
            <Badge variant={soon ? "warning" : "secondary"}>
              <CalendarClock /> {soon ? relativeDue(next, today) : formatDayMonth(next)}
            </Badge>
          </div>
        </div>
      </button>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right">
          <p className={cn("money text-sm font-semibold", cut && "text-muted-foreground line-through")}>{formatBRL(sub.amount)}</p>
          <p className="money text-[11px] text-muted-foreground">
            {sub.billingCycle === "mensal" ? "por mês" : `${CYCLE_LABEL[sub.billingCycle].toLowerCase()} · ${formatBRL(monthly)}/mês`}
          </p>
        </div>
        <label className="flex flex-col items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Switch checked={cut} onCheckedChange={onToggleCut} aria-label={`Simular corte de ${sub.name}`} />
          Simular corte
        </label>
      </div>
    </li>
  );
}

function Tile({ label, value, caption, highlight }: { label: string; value: string; caption?: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-xs", highlight && "border-primary/40 bg-accent/60")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("money mt-1 text-lg font-semibold", highlight && "text-primary")}>{value}</p>
      {caption ? <p className="text-[11px] text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
