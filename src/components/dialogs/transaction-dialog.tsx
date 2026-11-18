"use client";

import { useMemo, useState } from "react";
import { Banknote, CalendarClock, CreditCard, Landmark, ReceiptText, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { categoriesFor, TYPE_LABEL } from "@/lib/categories";
import { invoiceDueMonth } from "@/lib/cards";
import { installmentAmount } from "@/lib/finance";
import { addMonthsKey, formatBRL, monthKeyOf, monthLabel, monthShort, type MonthKey } from "@/lib/format";
import type { PaymentMethod, Transaction, TransactionType } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogColumn,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { CategorySelect } from "@/components/ui/category-select";
import { Segmented, Switch } from "@/components/ui/misc";
import { BankLogo } from "@/components/bank/bank-logo";

interface Props {
  transaction?: Transaction;
  defaults?: Partial<Transaction>;
  /** mês da ocorrência clicada (para marcar como paga nas recorrentes) */
  month?: MonthKey;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: TransactionType; label: string; icon: React.ReactNode; activeClassName?: string }[] = [
  { value: "despesa_diaria", label: "Gasto diário", icon: <TrendingDown />, activeClassName: "text-destructive" },
  { value: "conta_geral", label: "Conta geral", icon: <ReceiptText />, activeClassName: "text-warning" },
  { value: "receita", label: "Receita", icon: <TrendingUp />, activeClassName: "text-success" },
];

const chip =
  "inline-flex max-w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted";

export function TransactionDialog({ transaction, defaults, month, onClose }: Props) {
  const { data, save, remove, today } = useFinance();
  const { confirm } = useDialogs();
  const editing = Boolean(transaction);
  const initial = transaction ?? defaults;

  const [type, setType] = useState<TransactionType>(initial?.type ?? "despesa_diaria");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? today);
  const [category, setCategory] = useState(initial?.category ?? categoriesFor(initial?.type ?? "despesa_diaria")[0].id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initial?.paymentMethod ?? (data.cards.length > 0 && (initial?.type ?? "despesa_diaria") === "despesa_diaria" ? "cartao" : "pix_debito"),
  );
  const [cardId, setCardId] = useState(initial?.cardId ?? data.cards[0]?.id ?? "");
  const [accountId, setAccountId] = useState(initial?.accountId ?? data.accounts[0]?.id ?? "");
  const [installments, setInstallments] = useState(initial?.installments ?? 1);
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [recurringEnd, setRecurringEnd] = useState(initial?.recurringEnd ?? "");
  const occurrenceMonth = month ?? monthKeyOf(initial?.date ?? today);
  const [isPaid, setIsPaid] = useState(() => {
    if (!transaction) return defaults?.isPaid ?? true;
    if (transaction.recurring) return (transaction.paidMonths ?? []).includes(occurrenceMonth);
    return transaction.isPaid ?? true;
  });

  const categories = categoriesFor(type);
  const effectiveMethod: PaymentMethod = type === "receita" ? "pix_debito" : paymentMethod;
  const isCard = effectiveMethod === "cartao";
  const selectedCard = data.cards.find((c) => c.id === cardId);
  const canRepeat = type !== "despesa_diaria" && !(isCard && installments > 1);

  const changeType = (next: TransactionType) => {
    setType(next);
    const list = categoriesFor(next);
    if (!list.some((c) => c.id === category)) setCategory(list[0].id);
    if (next === "despesa_diaria") setRecurring(false);
  };

  const invoiceHint = useMemo(() => {
    if (!isCard || !selectedCard || !date) return null;
    const due = invoiceDueMonth(selectedCard, date);
    return `Entra na fatura que vence em ${monthLabel(due).toLowerCase()} (dia ${selectedCard.dueDay}).`;
  }, [isCard, selectedCard, date]);

  const installmentText =
    isCard && installments > 1 && amount > 0
      ? `${installments}x de ${formatBRL(installmentAmount(amount, installments, 0))} · última parcela em ${monthShort(
          addMonthsKey(monthKeyOf(date || today), installments - 1),
        )}`
      : null;

  const handleSave = () => {
    if (!(amount > 0)) {
      toast.error("Informe o valor.");
      return;
    }
    if (!description.trim()) {
      toast.error("Dê um nome ao lançamento.");
      return;
    }
    if (isCard && !cardId) {
      toast.error("Cadastre ou escolha um cartão.");
      return;
    }
    const repeat = canRepeat && recurring;
    const paidMonths = new Set(transaction?.paidMonths ?? []);
    if (repeat) {
      if (isPaid) paidMonths.add(occurrenceMonth);
      else paidMonths.delete(occurrenceMonth);
    }
    const now = Date.now();
    const record: Transaction = {
      id: transaction?.id ?? uid(),
      description: description.trim(),
      amount,
      type,
      category,
      date,
      paymentMethod: effectiveMethod,
      cardId: isCard ? cardId : null,
      accountId: !isCard && effectiveMethod !== "dinheiro" ? accountId || null : null,
      // guarda o banco também no lançamento (continua certo mesmo se o cartão/conta for excluído)
      bankSlug: isCard
        ? (selectedCard?.bankSlug ?? null)
        : effectiveMethod === "dinheiro"
          ? "dinheiro"
          : (data.accounts.find((a) => a.id === accountId)?.bankSlug ?? null),
      isPaid: type === "despesa_diaria" ? true : repeat ? true : isPaid,
      installments: isCard ? Math.max(1, installments) : 1,
      recurring: repeat,
      recurringEnd: repeat && recurringEnd ? recurringEnd : null,
      paidMonths: repeat ? [...paidMonths].sort() : [],
      notes: transaction?.notes ?? null,
      createdAt: transaction?.createdAt ?? now,
      updatedAt: now,
    };
    save("transactions", record);
    toast.success(editing ? "Lançamento atualizado." : `${TYPE_LABEL[type]} lançado${type === "receita" ? "a" : ""}!`);
    onClose();
  };

  const handleDelete = () => {
    if (!transaction) return;
    confirm({
      title: "Excluir lançamento?",
      description: transaction.recurring
        ? "Este lançamento se repete todo mês. Excluir remove todas as ocorrências (inclusive dos meses anteriores). Para parar só daqui pra frente, defina 'Repetir até'."
        : `"${transaction.description}" será excluído.`,
      confirmLabel: "Excluir",
      destructive: true,
      onConfirm: () => {
        remove("transactions", transaction.id);
        toast.success("Lançamento excluído.");
      },
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            {type === "receita"
              ? "Dinheiro que entra: salário, extras, vendas…"
              : type === "conta_geral"
                ? "Contas do mês: aluguel, luz, água, internet, faturas…"
                : "Gastos do dia a dia no Pix, débito, dinheiro ou cartão."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="md:grid-cols-2 md:gap-x-6">
          <Segmented value={type} onChange={changeType} options={TYPE_OPTIONS} className="md:col-span-2" />
          <DialogColumn>
            <MoneyInput value={amount} onChange={setAmount} size="lg" autoFocus={!editing} aria-label="Valor" />
            <div className="grid grid-cols-[minmax(0,1fr)_9.75rem] gap-3">
              <Field label="Descrição" htmlFor="tx-description">
                <Input
                  id="tx-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={type === "receita" ? "Ex.: Salário" : type === "conta_geral" ? "Ex.: Conta de luz" : "Ex.: Mercado"}
                  maxLength={80}
                />
              </Field>
              <Field label={type === "conta_geral" ? "Vencimento" : "Data"} htmlFor="tx-date">
                <Input id="tx-date" type="date" value={date} onChange={(event) => setDate(event.target.value || today)} />
              </Field>
            </div>
            <Field label="Categoria" htmlFor="tx-category">
              <CategorySelect id="tx-category" value={category} onChange={setCategory} categories={categories} />
            </Field>
          </DialogColumn>

          <DialogColumn>
            {type !== "receita" ? (
              <Field label="Como foi pago?">
                <Segmented
                  value={paymentMethod}
                  onChange={(value) => {
                    setPaymentMethod(value);
                    if (value !== "cartao") setInstallments(1);
                  }}
                  options={[
                    { value: "pix_debito", label: "Pix / débito", icon: <Landmark /> },
                    { value: "cartao", label: "Cartão", icon: <CreditCard /> },
                    { value: "dinheiro", label: "Dinheiro", icon: <Banknote /> },
                  ]}
                />
              </Field>
            ) : null}

            {isCard ? (
              data.cards.length === 0 ? (
                <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                  Você ainda não cadastrou cartões. Cadastre em <strong>Cartões e contas</strong> para lançar compras no crédito.
                </p>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-start gap-3">
                  <Field label="Cartão">
                    <div className="flex flex-wrap gap-1.5">
                      {data.cards.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCardId(c.id)}
                          aria-pressed={c.id === cardId}
                          className={cn(chip, c.id === cardId && "border-primary bg-accent font-medium")}
                        >
                          <BankLogo slug={c.bankSlug} size={22} />
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Parcelas">
                    <NativeSelect value={installments} onChange={(event) => setInstallments(Number(event.target.value))}>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? "À vista" : `${n}x`}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
              )
            ) : effectiveMethod === "pix_debito" ? (
              <Field label={type === "receita" ? "Entrou em qual conta?" : "Saiu de qual conta?"}>
                {data.accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Cadastre suas contas em Cartões e contas para ver os gastos por banco.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {data.accounts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAccountId(a.id === accountId ? "" : a.id)}
                        aria-pressed={a.id === accountId}
                        className={cn(chip, a.id === accountId && "border-primary bg-accent font-medium")}
                      >
                        <BankLogo slug={a.bankSlug} size={22} />
                        <span className="truncate">{a.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            ) : null}

            {invoiceHint || installmentText ? (
              <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <CalendarClock className="mt-0.5 size-4 shrink-0" />
                <div className="grid gap-0.5">
                  {installmentText ? <span className="font-medium text-foreground">{installmentText}</span> : null}
                  {invoiceHint ? <span>{invoiceHint}</span> : null}
                </div>
              </div>
            ) : null}

            {canRepeat ? (
              <div className="grid gap-3 rounded-xl border p-3">
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium">{type === "receita" ? "Receita fixa (todo mês)" : "Conta fixa (repete todo mês)"}</span>
                    <span className="block text-xs text-muted-foreground">Aparece sozinha nos próximos meses.</span>
                  </span>
                  <Switch checked={recurring} onCheckedChange={setRecurring} />
                </label>
                {recurring ? (
                  <Field label="Repetir até (opcional)" htmlFor="tx-end">
                    <Input id="tx-end" type="month" value={recurringEnd} min={monthKeyOf(date)} onChange={(event) => setRecurringEnd(event.target.value)} />
                  </Field>
                ) : null}
              </div>
            ) : null}

            {type !== "despesa_diaria" ? (
              <label className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <span>
                  <span className="block text-sm font-medium">{type === "receita" ? "Já recebi" : "Já está paga"}</span>
                  <span className="block text-xs text-muted-foreground">
                    {recurring ? `Vale para ${monthLabel(occurrenceMonth).toLowerCase()}.` : "Contas pendentes aparecem nos vencimentos."}
                  </span>
                </span>
                <Switch checked={isPaid} onCheckedChange={setIsPaid} />
              </label>
            ) : null}
          </DialogColumn>
        </DialogBody>
        <DialogFooter>
          {editing ? (
            <Button variant="destructive-ghost" className="sm:mr-auto" onClick={handleDelete}>
              <Trash2 /> Excluir
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>{editing ? "Salvar alterações" : "Lançar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
