import { isValidISODate, todayISO } from "./format";
import type {
  Account,
  AccountType,
  BillingCycle,
  Card,
  CardBrand,
  FinanceData,
  Goal,
  GoalPriority,
  PaymentMethod,
  Subscription,
  Transaction,
  TransactionType,
} from "./types";
import { clamp, toNumber, uid } from "./utils";

type Raw = Record<string, unknown>;

const str = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);
const optStr = (value: unknown): string | null => (typeof value === "string" && value ? value : null);
const num = (value: unknown, fallback = 0) => toNumber(value, fallback);
const bool = (value: unknown, fallback = false) => (typeof value === "boolean" ? value : fallback);
const day = (value: unknown, fallback: number) => clamp(Math.round(num(value, fallback)), 1, 31);
const date = (value: unknown) => (isValidISODate(value) ? value : todayISO());
const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;
const stamps = (raw: Raw) => {
  const createdAt = num(raw.createdAt, Date.now());
  return { createdAt, updatedAt: num(raw.updatedAt, createdAt) };
};
const id = (raw: Raw) => str(raw.id) || uid();

export function sanitizeAccount(raw: Raw): Account {
  return {
    id: id(raw),
    name: str(raw.name, "Conta"),
    bankSlug: str(raw.bankSlug, "outro"),
    type: oneOf<AccountType>(raw.type, ["corrente", "poupanca", "pagamento", "investimento", "carteira"], "corrente"),
    balance: num(raw.balance),
    color: optStr(raw.color),
    ...stamps(raw),
  };
}

export function sanitizeCard(raw: Raw): Card {
  return {
    id: id(raw),
    name: str(raw.name, "Cartão"),
    bankSlug: str(raw.bankSlug, "outro"),
    limit: Math.max(0, num(raw.limit)),
    closingDay: day(raw.closingDay, 1),
    dueDay: day(raw.dueDay, 10),
    brand: raw.brand ? oneOf<CardBrand>(raw.brand, ["visa", "mastercard", "elo", "amex", "hipercard", "outra"], "outra") : null,
    last4: optStr(raw.last4)?.replace(/\D/g, "").slice(-4) || null,
    color: optStr(raw.color),
    ...stamps(raw),
  };
}

export function sanitizeSubscription(raw: Raw): Subscription {
  return {
    id: id(raw),
    name: str(raw.name, "Assinatura"),
    amount: Math.max(0, num(raw.amount)),
    billingCycle: oneOf<BillingCycle>(raw.billingCycle, ["mensal", "trimestral", "semestral", "anual"], "mensal"),
    billingDay: day(raw.billingDay, 1),
    startDate: date(raw.startDate),
    paymentMethod: oneOf<"cartao" | "pix_debito">(raw.paymentMethod, ["cartao", "pix_debito"], "cartao"),
    cardId: optStr(raw.cardId),
    accountId: optStr(raw.accountId),
    bankSlug: optStr(raw.bankSlug),
    category: str(raw.category, "outros"),
    serviceSlug: optStr(raw.serviceSlug),
    active: bool(raw.active, true),
    ...stamps(raw),
  };
}

export function sanitizeTransaction(raw: Raw): Transaction {
  const paymentMethod = oneOf<PaymentMethod>(raw.paymentMethod, ["pix_debito", "cartao", "dinheiro"], "pix_debito");
  return {
    id: id(raw),
    description: str(raw.description, "Lançamento"),
    amount: Math.abs(num(raw.amount)),
    type: oneOf<TransactionType>(raw.type, ["receita", "despesa_diaria", "conta_geral"], "despesa_diaria"),
    category: str(raw.category, "outros"),
    date: date(raw.date),
    paymentMethod,
    accountId: optStr(raw.accountId),
    cardId: optStr(raw.cardId),
    bankSlug: optStr(raw.bankSlug),
    isPaid: bool(raw.isPaid, true),
    installments: paymentMethod === "cartao" ? clamp(Math.round(num(raw.installments, 1)), 1, 48) : 1,
    recurring: bool(raw.recurring, false),
    recurringEnd: typeof raw.recurringEnd === "string" && /^\d{4}-\d{2}$/.test(raw.recurringEnd) ? raw.recurringEnd : null,
    paidMonths: Array.isArray(raw.paidMonths) ? raw.paidMonths.filter((m): m is string => typeof m === "string") : [],
    notes: optStr(raw.notes),
    ...stamps(raw),
  };
}

export function sanitizeGoal(raw: Raw): Goal {
  return {
    id: id(raw),
    title: str(raw.title, "Objetivo"),
    targetAmount: Math.max(0, num(raw.targetAmount)),
    currentAmount: Math.max(0, num(raw.currentAmount)),
    targetDate: date(raw.targetDate),
    icon: str(raw.icon, "🎯"),
    color: str(raw.color, "#10b981"),
    priority: oneOf<GoalPriority>(raw.priority, ["alta", "media", "baixa"], "media"),
    ...stamps(raw),
  };
}

const list = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.filter((item): item is Raw => typeof item === "object" && item !== null) : [];

export function sanitizeData(raw: unknown): FinanceData {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Raw;
  return {
    accounts: list(source.accounts).map(sanitizeAccount),
    cards: list(source.cards).map(sanitizeCard),
    subscriptions: list(source.subscriptions).map(sanitizeSubscription),
    transactions: list(source.transactions).map(sanitizeTransaction),
    goals: list(source.goals).map(sanitizeGoal),
  };
}

export function buildBackup(data: FinanceData): string {
  return JSON.stringify({ app: "MoneySave", version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function parseBackup(text: string): FinanceData {
  const parsed = JSON.parse(text) as Raw;
  const payload = parsed && typeof parsed === "object" && "data" in parsed ? parsed.data : parsed;
  const data = sanitizeData(payload);
  const total = Object.values(data).reduce((acc, items) => acc + items.length, 0);
  if (total === 0) throw new Error("O arquivo não tem dados do MoneySave.");
  return data;
}

export const SANITIZERS = {
  accounts: sanitizeAccount,
  cards: sanitizeCard,
  subscriptions: sanitizeSubscription,
  transactions: sanitizeTransaction,
  goals: sanitizeGoal,
} as const;
