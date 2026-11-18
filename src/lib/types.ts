/**
 * Modelo de dados do MoneySave.
 * No Firestore cada coleção fica em users/{uid}/{coleção}/{id}.
 */

export type AccountType = "corrente" | "poupanca" | "pagamento" | "investimento" | "carteira";

export interface Account {
  id: string;
  name: string;
  /** slug do banco (ex.: "nubank") ou "ispb:XXXXXXXX" para outras instituições */
  bankSlug: string;
  type: AccountType;
  /** saldo atual informado pelo usuário */
  balance: number;
  color?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "outra";

export interface Card {
  id: string;
  name: string;
  bankSlug: string;
  limit: number;
  /** dia de fechamento da fatura (1-31) */
  closingDay: number;
  /** dia de vencimento da fatura (1-31) */
  dueDay: number;
  brand?: CardBrand | null;
  last4?: string | null;
  /** cor personalizada do cartão (hex); vazio = cor oficial do banco */
  color?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type BillingCycle = "mensal" | "trimestral" | "semestral" | "anual";

/** "pix_debito" = sai da conta (Pix, débito ou boleto) */
export type PaymentMethod = "pix_debito" | "cartao" | "dinheiro";

export interface Subscription {
  id: string;
  name: string;
  /** valor cobrado a cada ciclo */
  amount: number;
  billingCycle: BillingCycle;
  /** dia da cobrança (1-31) */
  billingDay: number;
  /** data da primeira cobrança considerada (AAAA-MM-DD) */
  startDate: string;
  paymentMethod: Exclude<PaymentMethod, "dinheiro">;
  cardId?: string | null;
  accountId?: string | null;
  bankSlug?: string | null;
  category: string;
  /** chave do serviço conhecido (netflix, spotify...) para cor e ícone */
  serviceSlug?: string | null;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TransactionType = "receita" | "despesa_diaria" | "conta_geral";

export interface Transaction {
  id: string;
  description: string;
  /** valor total (sempre positivo) */
  amount: number;
  type: TransactionType;
  category: string;
  /** data do lançamento / compra / vencimento (AAAA-MM-DD) */
  date: string;
  paymentMethod: PaymentMethod;
  accountId?: string | null;
  cardId?: string | null;
  bankSlug?: string | null;
  /** conta paga / receita recebida (lançamentos não recorrentes) */
  isPaid: boolean;
  /** número de parcelas (compras no cartão) */
  installments: number;
  /** repete todo mês (contas fixas e receitas fixas) */
  recurring: boolean;
  /** último mês da recorrência (AAAA-MM); vazio = sem fim */
  recurringEnd?: string | null;
  /** meses (AAAA-MM) marcados como pagos nas recorrentes */
  paidMonths?: string[];
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type GoalPriority = "alta" | "media" | "baixa";

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  /** data-alvo (AAAA-MM-DD) */
  targetDate: string;
  icon: string;
  color: string;
  priority: GoalPriority;
  createdAt: number;
  updatedAt: number;
}

export interface FinanceData {
  accounts: Account[];
  cards: Card[];
  subscriptions: Subscription[];
  transactions: Transaction[];
  goals: Goal[];
}

export type CollectionName = keyof FinanceData;

export interface EntityMap {
  accounts: Account;
  cards: Card;
  subscriptions: Subscription;
  transactions: Transaction;
  goals: Goal;
}

export const COLLECTIONS: CollectionName[] = [
  "accounts",
  "cards",
  "subscriptions",
  "transactions",
  "goals",
];

export const EMPTY_DATA: FinanceData = {
  accounts: [],
  cards: [],
  subscriptions: [],
  transactions: [],
  goals: [],
};
