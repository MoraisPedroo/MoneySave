import { addMonthsKey, dateInMonth, dayOf, daysInMonth, monthDiff, monthKeyOf, type MonthKey } from "./format";
import { CYCLE_MONTHS, installmentAmount } from "./finance";
import type { Card, Subscription, Transaction } from "./types";
import { roundMoney, sumBy } from "./utils";

/**
 * Regras de fatura (padrão dos cartões brasileiros):
 * - compra feita ANTES do dia de fechamento entra na fatura que fecha naquele mês;
 * - compra no dia do fechamento ou depois vai para a fatura seguinte;
 * - se o vencimento é depois do fechamento, vence no mesmo mês; senão, no mês seguinte;
 * - cada parcela cai na fatura do mês seguinte à anterior.
 * O mês da fatura é identificado pelo mês de VENCIMENTO.
 */

function effectiveDay(month: MonthKey, day: number) {
  return Math.min(Math.max(1, day), daysInMonth(month));
}

export function closingMonthForPurchase(card: Pick<Card, "closingDay">, date: string): MonthKey {
  const month = monthKeyOf(date);
  return dayOf(date) >= effectiveDay(month, card.closingDay) ? addMonthsKey(month, 1) : month;
}

export function dueMonthFromClosing(card: Pick<Card, "closingDay" | "dueDay">, closingMonth: MonthKey): MonthKey {
  return card.dueDay > card.closingDay ? closingMonth : addMonthsKey(closingMonth, 1);
}

export function invoiceDueMonth(card: Pick<Card, "closingDay" | "dueDay">, purchaseDate: string): MonthKey {
  return dueMonthFromClosing(card, closingMonthForPurchase(card, purchaseDate));
}

export function closingDateForDueMonth(card: Pick<Card, "closingDay" | "dueDay">, dueMonth: MonthKey): string {
  const closingMonth = card.dueDay > card.closingDay ? dueMonth : addMonthsKey(dueMonth, -1);
  return dateInMonth(closingMonth, card.closingDay);
}

export type InvoiceStatus = "aberta" | "fechada" | "vencida" | "futura";

export interface InvoiceItem {
  key: string;
  label: string;
  amount: number;
  /** data da compra ou da cobrança */
  date: string;
  kind: "compra" | "assinatura";
  installment?: { index: number; total: number };
  txId?: string;
  subId?: string;
}

export interface Invoice {
  dueMonth: MonthKey;
  dueDate: string;
  closingDate: string;
  status: InvoiceStatus;
  total: number;
  items: InvoiceItem[];
}

function statusFor(closingDate: string, dueDate: string, today: string): InvoiceStatus {
  if (today > dueDate) return "vencida";
  if (today >= closingDate) return "fechada";
  return "aberta";
}

/** Gera as faturas do cartão entre fromDueMonth e (fromDueMonth + count - 1). */
export function cardInvoices(
  card: Card,
  transactions: Transaction[],
  subscriptions: Subscription[],
  fromDueMonth: MonthKey,
  count: number,
  today: string,
): Invoice[] {
  const lastDueMonth = addMonthsKey(fromDueMonth, count - 1);
  const buckets = new Map<MonthKey, InvoiceItem[]>();
  const push = (dueMonth: MonthKey, item: InvoiceItem) => {
    if (dueMonth < fromDueMonth || dueMonth > lastDueMonth) return;
    const list = buckets.get(dueMonth) ?? [];
    list.push(item);
    buckets.set(dueMonth, list);
  };

  for (const tx of transactions) {
    if (tx.paymentMethod !== "cartao" || tx.cardId !== card.id || tx.type === "receita") continue;
    if (tx.recurring) {
      // conta fixa no cartão: uma cobrança por mês a partir da data inicial
      const start = monthKeyOf(tx.date);
      for (let m = addMonthsKey(fromDueMonth, -2); m <= lastDueMonth; m = addMonthsKey(m, 1)) {
        if (m < start) continue;
        if (tx.recurringEnd && m > tx.recurringEnd) continue;
        const date = dateInMonth(m, dayOf(tx.date));
        push(invoiceDueMonth(card, date), { key: `${tx.id}:${m}`, label: tx.description, amount: tx.amount, date, kind: "compra", txId: tx.id });
      }
      continue;
    }
    const count = Math.max(1, tx.installments || 1);
    const firstDue = invoiceDueMonth(card, tx.date);
    for (let i = 0; i < count; i++) {
      push(addMonthsKey(firstDue, i), {
        key: `${tx.id}:${i}`,
        label: tx.description,
        amount: installmentAmount(tx.amount, count, i),
        date: tx.date,
        kind: "compra",
        installment: count > 1 ? { index: i + 1, total: count } : undefined,
        txId: tx.id,
      });
    }
  }

  for (const sub of subscriptions) {
    if (!sub.active || sub.paymentMethod !== "cartao" || sub.cardId !== card.id) continue;
    const start = monthKeyOf(sub.startDate);
    const step = CYCLE_MONTHS[sub.billingCycle];
    for (let m = addMonthsKey(fromDueMonth, -2); m <= lastDueMonth; m = addMonthsKey(m, 1)) {
      if (m < start) continue;
      if (monthDiff(start, m) % step !== 0) continue;
      const date = dateInMonth(m, sub.billingDay);
      push(invoiceDueMonth(card, date), { key: `${sub.id}:${m}`, label: sub.name, amount: sub.amount, date, kind: "assinatura", subId: sub.id });
    }
  }

  const invoices: Invoice[] = [];
  let openFound = false;
  for (let i = 0; i < count; i++) {
    const dueMonth = addMonthsKey(fromDueMonth, i);
    const items = (buckets.get(dueMonth) ?? []).sort((a, b) => b.date.localeCompare(a.date));
    const dueDate = dateInMonth(dueMonth, card.dueDay);
    const closingDate = closingDateForDueMonth(card, dueMonth);
    let status = statusFor(closingDate, dueDate, today);
    // só a primeira fatura ainda não fechada está "aberta"; as seguintes são futuras
    if (status === "aberta") {
      if (openFound) status = "futura";
      openFound = true;
    }
    invoices.push({
      dueMonth,
      dueDate,
      closingDate,
      status,
      total: sumBy(items, (item) => item.amount),
      items,
    });
  }
  return invoices;
}

export interface CardOverview {
  card: Card;
  /** fatura aberta (ainda recebendo compras) */
  openInvoice: Invoice;
  /** próxima fatura a vencer (fechada ou aberta) */
  nextDue: Invoice;
  invoices: Invoice[];
  used: number;
  available: number;
  usage: number;
  bestPurchaseDay: number;
}

export function cardOverview(card: Card, transactions: Transaction[], subscriptions: Subscription[], today: string): CardOverview {
  const todayMonth = monthKeyOf(today);
  // começa um mês antes para enxergar a fatura fechada que ainda não venceu
  const invoices = cardInvoices(card, transactions, subscriptions, addMonthsKey(todayMonth, -1), 14, today);
  const upcoming = invoices.filter((inv) => inv.status !== "vencida");
  const openInvoice = upcoming.find((inv) => inv.status === "aberta") ?? upcoming[0] ?? invoices[invoices.length - 1];
  const nextDue = upcoming[0] ?? openInvoice;

  // limite usado: tudo que já foi comprado/cobrado e ainda não venceu (inclui parcelas futuras)
  let used = 0;
  for (const inv of upcoming) {
    for (const item of inv.items) {
      if (item.date <= today) used += item.amount;
    }
  }
  used = roundMoney(used);
  const available = roundMoney(card.limit - used);
  return {
    card,
    openInvoice,
    nextDue,
    invoices,
    used,
    available,
    usage: card.limit > 0 ? used / card.limit : 0,
    bestPurchaseDay: card.closingDay,
  };
}
