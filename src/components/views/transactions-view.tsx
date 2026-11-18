"use client";

import { useMemo, useState } from "react";
import { Circle, CircleCheck, Plus, ReceiptText, Repeat, Search, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { bankName } from "@/lib/banks";
import { getCategory } from "@/lib/categories";
import { occurrencesInMonth, txBankSlug, type Occurrence } from "@/lib/finance";
import { formatBRL, formatWeekdayLong, monthName } from "@/lib/format";
import type { TransactionType } from "@/lib/types";
import { cn, normalizeText, sumBy } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge, EmptyState, Skeleton, Tabs, TabsList, TabsTrigger } from "@/components/ui/misc";
import { BankLogo } from "@/components/bank/bank-logo";
import { CategoryIcon } from "@/components/bank/avatars";

type Filter = "todos" | TransactionType;
type Status = "todas" | "pendentes" | "pagas";

const METHOD_LABEL = { pix_debito: "Pix/débito", cartao: "Cartão", dinheiro: "Dinheiro" } as const;

export function TransactionsView() {
  const { data, month, ready, save } = useFinance();
  const { open } = useDialogs();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [bank, setBank] = useState("todos");
  const [status, setStatus] = useState<Status>("todas");

  const occurrences = useMemo(() => occurrencesInMonth(data.transactions, month), [data.transactions, month]);

  const banksInMonth = useMemo(() => {
    const set = new Set(occurrences.map((o) => txBankSlug(o.tx, data)));
    return [...set];
  }, [occurrences, data]);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return occurrences.filter((o) => {
      if (filter !== "todos" && o.tx.type !== filter) return false;
      if (bank !== "todos" && txBankSlug(o.tx, data) !== bank) return false;
      if (status === "pendentes" && (o.tx.type === "despesa_diaria" || o.isPaid)) return false;
      if (status === "pagas" && o.tx.type !== "despesa_diaria" && !o.isPaid) return false;
      if (q && !normalizeText(`${o.tx.description} ${getCategory(o.tx.type, o.tx.category).label}`).includes(q)) return false;
      return true;
    });
  }, [occurrences, filter, bank, status, query, data]);

  const groups = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of filtered) {
      const list = map.get(o.date) ?? [];
      list.push(o);
      map.set(o.date, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totals = useMemo(() => {
    const income = sumBy(occurrences.filter((o) => o.tx.type === "receita"), (o) => o.amount);
    const daily = sumBy(occurrences.filter((o) => o.tx.type === "despesa_diaria"), (o) => o.amount);
    const bills = sumBy(occurrences.filter((o) => o.tx.type === "conta_geral"), (o) => o.amount);
    const pending = occurrences.filter((o) => o.tx.type === "conta_geral" && !o.isPaid);
    return { income, daily, bills, pendingCount: pending.length, pending: sumBy(pending, (o) => o.amount) };
  }, [occurrences]);

  const togglePaid = (o: Occurrence) => {
    const tx = o.tx;
    if (tx.recurring) {
      const set = new Set(tx.paidMonths ?? []);
      if (set.has(o.month)) set.delete(o.month);
      else set.add(o.month);
      save("transactions", { ...tx, paidMonths: [...set].sort() });
    } else {
      save("transactions", { ...tx, isPaid: !tx.isPaid });
    }
    toast.success(o.isPaid ? "Marcada como pendente." : tx.type === "receita" ? "Marcada como recebida." : "Conta paga! ✅");
  };

  if (!ready || !month) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile label="Receitas" value={totals.income} tone="success" icon={<TrendingUp className="size-4" />} />
        <SummaryTile label="Gastos diários" value={totals.daily} tone="destructive" icon={<TrendingDown className="size-4" />} />
        <SummaryTile label="Contas gerais" value={totals.bills} tone="warning" icon={<ReceiptText className="size-4" />} />
        <SummaryTile
          label="Contas pendentes"
          value={totals.pending}
          tone="muted"
          caption={totals.pendingCount ? `${totals.pendingCount} conta(s) a pagar` : "Nenhuma pendência"}
          icon={<Circle className="size-4" />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="soft" size="sm" onClick={() => open({ type: "transaction", defaults: { type: "despesa_diaria" } })}>
          <Plus /> Gasto diário
        </Button>
        <Button variant="soft" size="sm" onClick={() => open({ type: "transaction", defaults: { type: "conta_geral", category: "moradia", paymentMethod: "pix_debito" } })}>
          <Plus /> Conta geral
        </Button>
        <Button variant="soft" size="sm" onClick={() => open({ type: "transaction", defaults: { type: "receita", category: "salario" } })}>
          <Plus /> Receita
        </Button>
      </div>

      <Card className="overflow-hidden" data-tour="tx-list">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="max-w-full">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="despesa_diaria">Gastos</TabsTrigger>
              <TabsTrigger value="conta_geral">Contas</TabsTrigger>
              <TabsTrigger value="receita">Receitas</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar lançamento" className="pl-9" aria-label="Buscar lançamento" />
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
            <NativeSelect value={bank} onChange={(e) => setBank(e.target.value)} aria-label="Filtrar por banco" className="sm:w-44">
              <option value="todos">Todos os bancos</option>
              {banksInMonth.map((slug) => (
                <option key={slug} value={slug}>
                  {bankName(slug)}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as Status)} aria-label="Filtrar por situação" className="sm:w-40">
              <option value="todas">Todas</option>
              <option value="pendentes">Pendentes</option>
              <option value="pagas">Pagas/recebidas</option>
            </NativeSelect>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<ReceiptText />}
              title={occurrences.length ? "Nada encontrado com esses filtros" : `Nenhum lançamento em ${monthName(month).toLowerCase()}`}
              description={occurrences.length ? "Tente limpar a busca ou trocar os filtros." : "Lance seus gastos do dia, contas do mês e receitas para ver quanto sobra."}
              action={
                <Button onClick={() => open({ type: "transaction" })}>
                  <Plus /> Novo lançamento
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y">
            {groups.map(([date, items]) => {
              const dayTotal = sumBy(items, (o) => (o.tx.type === "receita" ? o.amount : -o.amount));
              return (
                <section key={date}>
                  <div className="flex items-center justify-between bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <span>{formatWeekdayLong(date)}</span>
                    <span className={cn("money", dayTotal >= 0 ? "text-success" : "")}>{formatBRL(dayTotal)}</span>
                  </div>
                  <ul className="divide-y">
                    {items.map((o) => (
                      <TransactionRow key={o.key} occurrence={o} onTogglePaid={() => togglePaid(o)} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function TransactionRow({ occurrence, onTogglePaid }: { occurrence: Occurrence; onTogglePaid: () => void }) {
  const { data } = useFinance();
  const { open } = useDialogs();
  const { tx } = occurrence;
  const category = getCategory(tx.type, tx.category);
  const slug = txBankSlug(tx, data);
  const card = tx.paymentMethod === "cartao" ? data.cards.find((c) => c.id === tx.cardId) : undefined;
  const isIncome = tx.type === "receita";
  const showStatus = tx.type !== "despesa_diaria";

  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => open({ type: "transaction", transaction: tx, month: occurrence.month })}
      >
        <CategoryIcon category={category} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{tx.description}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{category.label}</span>
            <span className="inline-flex items-center gap-1">
              <BankLogo slug={slug} size={14} shape="circle" />
              {card ? card.name : bankName(slug)}
            </span>
            {!isIncome ? <span>{METHOD_LABEL[tx.paymentMethod]}</span> : null}
            {occurrence.installment ? (
              <Badge variant="secondary">
                {occurrence.installment.index}/{occurrence.installment.total}
              </Badge>
            ) : null}
            {tx.recurring ? (
              <Badge variant="outline">
                <Repeat /> Fixa
              </Badge>
            ) : null}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("money text-sm font-semibold", isIncome ? "text-success" : "text-foreground")}>
          {isIncome ? "+" : "−"} {formatBRL(occurrence.amount)}
        </span>
        {showStatus ? (
          <button
            type="button"
            onClick={onTogglePaid}
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-colors",
              occurrence.isPaid ? "text-success hover:bg-success-soft" : "text-muted-foreground hover:bg-muted",
            )}
            aria-label={occurrence.isPaid ? "Marcar como pendente" : isIncome ? "Marcar como recebida" : "Marcar como paga"}
            title={occurrence.isPaid ? (isIncome ? "Recebida" : "Paga") : "Pendente"}
          >
            {occurrence.isPaid ? <CircleCheck className="size-5" /> : <Circle className="size-5" />}
          </button>
        ) : (
          <span className="size-8" aria-hidden />
        )}
      </div>
    </li>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  icon,
  caption,
}: {
  label: string;
  value: number;
  tone: "success" | "destructive" | "warning" | "muted";
  icon: React.ReactNode;
  caption?: string;
}) {
  const toneClass = {
    success: "bg-success-soft text-success",
    destructive: "bg-destructive-soft text-destructive",
    warning: "bg-warning-soft text-warning",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", toneClass)}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="money mt-2 text-lg font-semibold">{formatBRL(value)}</p>
      {caption ? <p className="text-[11px] text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
