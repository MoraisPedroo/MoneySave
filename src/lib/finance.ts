import {
  addMonthsKey,
  dateInMonth,
  dayOf,
  monthDiff,
  monthKeyOf,
  type MonthKey,
} from "./format";
import { getCategory, getSubscriptionCategory } from "./categories";
import type {
  BillingCycle,
  Card,
  FinanceData,
  Subscription,
  Transaction,
  TransactionType,
} from "./types";
import { roundMoney, sumBy } from "./utils";

/* ------------------------------------------------------------------ */
/* Ciclos de assinatura                                                */
/* ------------------------------------------------------------------ */

export const CYCLE_MONTHS: Record<BillingCycle, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

/** Custo mensal equivalente: mensal = valor; anual = valor / 12 (regra do guia). */
export function monthlyEquivalent(sub: Pick<Subscription, "amount" | "billingCycle">): number {
  return roundMoney(sub.amount / CYCLE_MONTHS[sub.billingCycle]);
}

export function subscriptionStarted(sub: Subscription, month: MonthKey): boolean {
  return monthKeyOf(sub.startDate) <= month;
}

/** Se a assinatura gera uma cobrança no mês informado. */
export function chargesInMonth(sub: Subscription, month: MonthKey): boolean {
  const start = monthKeyOf(sub.startDate);
  if (month < start) return false;
  return monthDiff(start, month) % CYCLE_MONTHS[sub.billingCycle] === 0;
}

/** Próxima data de cobrança a partir de hoje. */
export function nextChargeDate(sub: Subscription, today: string): string {
  let month = monthKeyOf(today);
  const start = monthKeyOf(sub.startDate);
  if (month < start) month = start;
  for (let i = 0; i < 24; i++) {
    const candidate = addMonthsKey(month, i);
    if (!chargesInMonth(sub, candidate)) continue;
    const date = dateInMonth(candidate, sub.billingDay);
    if (date >= today) return date;
  }
  return dateInMonth(addMonthsKey(month, CYCLE_MONTHS[sub.billingCycle]), sub.billingDay);
}

/* ------------------------------------------------------------------ */
/* Parcelas e ocorrências de lançamentos                               */
/* ------------------------------------------------------------------ */

/** Valor da parcela (índice 0-based), distribuindo os centavos que sobram nas primeiras. */
export function installmentAmount(total: number, count: number, index: number): number {
  const n = Math.max(1, Math.floor(count));
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const remainder = cents - base * n;
  return (base + (index < remainder ? 1 : 0)) / 100;
}

export interface Occurrence {
  key: string;
  tx: Transaction;
  /** data efetiva no mês consultado */
  date: string;
  month: MonthKey;
  amount: number;
  installment?: { index: number; total: number };
  isPaid: boolean;
}

/** Lança as ocorrências de um mês: recorrências mensais, parcelas e lançamentos únicos. */
export function occurrencesInMonth(transactions: Transaction[], month: MonthKey): Occurrence[] {
  const result: Occurrence[] = [];
  for (const tx of transactions) {
    const start = monthKeyOf(tx.date);
    if (tx.recurring) {
      if (month < start) continue;
      if (tx.recurringEnd && month > tx.recurringEnd) continue;
      result.push({
        key: `${tx.id}:${month}`,
        tx,
        date: dateInMonth(month, dayOf(tx.date)),
        month,
        amount: tx.amount,
        isPaid: (tx.paidMonths ?? []).includes(month),
      });
      continue;
    }
    const installments = tx.paymentMethod === "cartao" ? Math.max(1, tx.installments || 1) : 1;
    if (installments > 1) {
      const index = monthDiff(start, month);
      if (index < 0 || index >= installments) continue;
      result.push({
        key: `${tx.id}:${month}`,
        tx,
        date: dateInMonth(month, dayOf(tx.date)),
        month,
        amount: installmentAmount(tx.amount, installments, index),
        installment: { index: index + 1, total: installments },
        isPaid: tx.isPaid,
      });
      continue;
    }
    if (start !== month) continue;
    result.push({ key: `${tx.id}:${month}`, tx, date: tx.date, month, amount: tx.amount, isPaid: tx.isPaid });
  }
  return result.sort((a, b) => (a.date === b.date ? b.tx.createdAt - a.tx.createdAt : b.date.localeCompare(a.date)));
}

/* ------------------------------------------------------------------ */
/* Banco de cada lançamento                                            */
/* ------------------------------------------------------------------ */

export function txBankSlug(tx: Transaction, data: Pick<FinanceData, "cards" | "accounts">): string {
  if (tx.paymentMethod === "cartao" && tx.cardId) {
    const card = data.cards.find((c) => c.id === tx.cardId);
    if (card) return card.bankSlug;
  }
  if (tx.paymentMethod === "dinheiro") return "dinheiro";
  if (tx.accountId) {
    const account = data.accounts.find((a) => a.id === tx.accountId);
    if (account) return account.bankSlug;
  }
  return tx.bankSlug || "outro";
}

export function subscriptionBankSlug(sub: Subscription, data: Pick<FinanceData, "cards" | "accounts">): string {
  if (sub.paymentMethod === "cartao" && sub.cardId) {
    const card = data.cards.find((c) => c.id === sub.cardId);
    if (card) return card.bankSlug;
  }
  if (sub.accountId) {
    const account = data.accounts.find((a) => a.id === sub.accountId);
    if (account) return account.bankSlug;
  }
  return sub.bankSlug || "outro";
}

/* ------------------------------------------------------------------ */
/* Resumo do mês: "Quanto Sobra"                                       */
/* ------------------------------------------------------------------ */

export interface CategoryTotal {
  id: string;
  type: TransactionType | "assinatura";
  label: string;
  color: string;
  amount: number;
}

export interface ExpenseItem {
  kind: "tx" | "sub";
  id: string;
  label: string;
  amount: number;
  bankSlug: string;
  detail: string;
}

export interface MonthSummary {
  month: MonthKey;
  income: number;
  /** gastos diários no Pix / débito / dinheiro */
  daily: number;
  /** contas gerais pagas fora do cartão */
  bills: number;
  /** compras e contas no cartão de crédito (parcelas do mês) */
  cards: number;
  /** assinaturas ativas (equivalente mensal) */
  subscriptions: number;
  expenses: number;
  /** Quanto Sobra = Receitas − (Gastos diários + Contas gerais + Cartões + Assinaturas) */
  free: number;
  /** fração da renda comprometida (null quando não há receita) */
  committed: number | null;
  pendingBills: number;
  pendingBillsCount: number;
  occurrences: Occurrence[];
  byCategory: CategoryTotal[];
  byBank: { slug: string; amount: number }[];
  byCard: { cardId: string; amount: number }[];
  topExpenses: ExpenseItem[];
  activeSubscriptions: Subscription[];
}

export function monthSummary(
  data: FinanceData,
  month: MonthKey,
  cuts: ReadonlySet<string> = new Set(),
): MonthSummary {
  const occurrences = occurrencesInMonth(data.transactions, month);
  const incomeOcc = occurrences.filter((o) => o.tx.type === "receita");
  const expenseOcc = occurrences.filter((o) => o.tx.type !== "receita");
  const cardOcc = expenseOcc.filter((o) => o.tx.paymentMethod === "cartao");
  const dailyOcc = expenseOcc.filter((o) => o.tx.type === "despesa_diaria" && o.tx.paymentMethod !== "cartao");
  const billOcc = expenseOcc.filter((o) => o.tx.type === "conta_geral" && o.tx.paymentMethod !== "cartao");

  const activeSubscriptions = data.subscriptions.filter(
    (s) => s.active && !cuts.has(s.id) && subscriptionStarted(s, month),
  );

  const income = sumBy(incomeOcc, (o) => o.amount);
  const daily = sumBy(dailyOcc, (o) => o.amount);
  const bills = sumBy(billOcc, (o) => o.amount);
  const cards = sumBy(cardOcc, (o) => o.amount);
  const subscriptions = sumBy(activeSubscriptions, monthlyEquivalent);
  const expenses = roundMoney(daily + bills + cards + subscriptions);
  const free = roundMoney(income - expenses);

  const pendingBillOcc = expenseOcc.filter((o) => o.tx.type === "conta_geral" && !o.isPaid && o.tx.paymentMethod !== "cartao");

  // Categorias
  const categoryMap = new Map<string, CategoryTotal>();
  for (const o of expenseOcc) {
    const def = getCategory(o.tx.type, o.tx.category);
    const key = `${o.tx.type}:${def.id}`;
    const current = categoryMap.get(key) ?? { id: def.id, type: o.tx.type, label: def.label, color: def.color, amount: 0 };
    current.amount = roundMoney(current.amount + o.amount);
    categoryMap.set(key, current);
  }
  if (subscriptions > 0) {
    categoryMap.set("assinaturas", {
      id: "assinaturas",
      type: "assinatura",
      label: "Assinaturas",
      color: "#8b5cf6",
      amount: subscriptions,
    });
  }
  const byCategory = [...categoryMap.values()].sort((a, b) => b.amount - a.amount);

  // Bancos
  const bankMap = new Map<string, number>();
  for (const o of expenseOcc) {
    const slug = txBankSlug(o.tx, data);
    bankMap.set(slug, roundMoney((bankMap.get(slug) ?? 0) + o.amount));
  }
  for (const s of activeSubscriptions) {
    const slug = subscriptionBankSlug(s, data);
    bankMap.set(slug, roundMoney((bankMap.get(slug) ?? 0) + monthlyEquivalent(s)));
  }
  const byBank = [...bankMap.entries()]
    .map(([slug, amount]) => ({ slug, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Cartões (compras do mês + assinaturas no cartão)
  const cardMap = new Map<string, number>();
  for (const o of cardOcc) {
    if (!o.tx.cardId) continue;
    cardMap.set(o.tx.cardId, roundMoney((cardMap.get(o.tx.cardId) ?? 0) + o.amount));
  }
  for (const s of activeSubscriptions) {
    if (s.paymentMethod !== "cartao" || !s.cardId) continue;
    cardMap.set(s.cardId, roundMoney((cardMap.get(s.cardId) ?? 0) + monthlyEquivalent(s)));
  }
  const byCard = [...cardMap.entries()]
    .map(([cardId, amount]) => ({ cardId, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Maiores despesas (para o diagnóstico de corte)
  const topExpenses: ExpenseItem[] = [
    ...expenseOcc
      .filter((o) => o.tx.category !== "moradia")
      .map<ExpenseItem>((o) => ({
        kind: "tx",
        id: o.tx.id,
        label: o.tx.description,
        amount: o.amount,
        bankSlug: txBankSlug(o.tx, data),
        detail: getCategory(o.tx.type, o.tx.category).label,
      })),
    ...activeSubscriptions.map<ExpenseItem>((s) => ({
      kind: "sub",
      id: s.id,
      label: s.name,
      amount: monthlyEquivalent(s),
      bankSlug: subscriptionBankSlug(s, data),
      detail: `Assinatura · ${getSubscriptionCategory(s.category).label}`,
    })),
  ]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    month,
    income,
    daily,
    bills,
    cards,
    subscriptions,
    expenses,
    free,
    committed: income > 0 ? expenses / income : null,
    pendingBills: sumBy(pendingBillOcc, (o) => o.amount),
    pendingBillsCount: pendingBillOcc.length,
    occurrences,
    byCategory,
    byBank,
    byCard,
    topExpenses,
    activeSubscriptions,
  };
}

export interface TrendPoint {
  month: MonthKey;
  income: number;
  expenses: number;
  free: number;
}

export function monthlyTrend(data: FinanceData, endMonth: MonthKey, count = 6, cuts?: ReadonlySet<string>): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const month = addMonthsKey(endMonth, -i);
    const s = monthSummary(data, month, cuts);
    points.push({ month, income: s.income, expenses: s.expenses, free: s.free });
  }
  return points;
}

/** Total de assinaturas ativas (mensal e anual). */
export function subscriptionTotals(subs: Subscription[], cuts: ReadonlySet<string> = new Set()) {
  const active = subs.filter((s) => s.active && !cuts.has(s.id));
  const monthly = sumBy(active, monthlyEquivalent);
  return { monthly, yearly: roundMoney(monthly * 12), count: active.length };
}

export function cardById(cards: Card[], id?: string | null): Card | undefined {
  return id ? cards.find((c) => c.id === id) : undefined;
}
