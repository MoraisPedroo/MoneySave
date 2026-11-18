import { addMonthsKey, dateInMonth, dayOf, monthKeyOf, toISODate, parseISODate } from "./format";
import { addMonths } from "date-fns";
import type { Account, Card, FinanceData, Goal, Subscription, Transaction } from "./types";
import { uid } from "./utils";

/** Gerador pseudoaleatório determinístico para o exemplo ficar sempre igual. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Dados de exemplo realistas (Nubank, Inter, PicPay e Sicoob) relativos à data de hoje. */
export function buildSampleData(today: string): FinanceData {
  const now = Date.now();
  const stamp = { createdAt: now, updatedAt: now };
  const month = monthKeyOf(today);
  const todayDay = dayOf(today);
  const rand = seeded(42);
  const at = (m: string, day: number) => dateInMonth(m, day);
  const upToToday = (day: number) => Math.min(day, todayDay);
  const monthsAgo = (n: number) => addMonthsKey(month, -n);

  const acc = { nubank: uid(), inter: uid(), picpay: uid(), sicoob: uid() };
  const card = { nubank: uid(), inter: uid(), picpay: uid(), sicoob: uid() };

  const accounts: Account[] = [
    { id: acc.nubank, name: "Conta Nubank", bankSlug: "nubank", type: "corrente", balance: 1850.32, ...stamp },
    { id: acc.inter, name: "Conta Inter", bankSlug: "inter", type: "corrente", balance: 640.1, ...stamp },
    { id: acc.picpay, name: "Carteira PicPay", bankSlug: "picpay", type: "pagamento", balance: 220, ...stamp },
    { id: acc.sicoob, name: "Poupança Sicoob", bankSlug: "sicoob", type: "poupanca", balance: 3200, ...stamp },
  ];

  const cards: Card[] = [
    { id: card.nubank, name: "Nubank Mastercard", bankSlug: "nubank", limit: 4500, closingDay: 3, dueDay: 10, brand: "mastercard", last4: "4821", ...stamp },
    { id: card.inter, name: "Inter Gold", bankSlug: "inter", limit: 2500, closingDay: 25, dueDay: 5, brand: "mastercard", last4: "1093", ...stamp },
    { id: card.picpay, name: "PicPay Card", bankSlug: "picpay", limit: 1200, closingDay: 12, dueDay: 20, brand: "mastercard", last4: "7765", ...stamp },
    { id: card.sicoob, name: "Sicoob Mastercard", bankSlug: "sicoob", limit: 3000, closingDay: 28, dueDay: 8, brand: "mastercard", last4: "3310", ...stamp },
  ];

  const sub = (
    name: string,
    amount: number,
    billingDay: number,
    cardId: string,
    category: string,
    serviceSlug: string,
    billingCycle: Subscription["billingCycle"] = "mensal",
    startOffset = 8,
  ): Subscription => ({
    id: uid(),
    name,
    amount,
    billingCycle,
    billingDay,
    startDate: at(monthsAgo(startOffset), billingDay),
    paymentMethod: "cartao",
    cardId,
    accountId: null,
    bankSlug: null,
    category,
    serviceSlug,
    active: true,
    ...stamp,
  });

  const subscriptions: Subscription[] = [
    sub("Netflix", 44.9, 12, card.nubank, "streaming", "netflix"),
    sub("Spotify", 21.9, 5, card.nubank, "musica", "spotify"),
    sub("iCloud+ 50 GB", 5.9, 2, card.nubank, "nuvem", "icloud"),
    sub("Amazon Prime", 19.9, 18, card.inter, "streaming", "prime"),
    sub("YouTube Premium", 26.9, 9, card.inter, "streaming", "youtube"),
    sub("Disney+", 33.9, 22, card.picpay, "streaming", "disney"),
    sub("Duolingo Super", 239.9, 15, card.picpay, "educacao", "duolingo", "anual", 4),
    sub("Academia", 129.9, 10, card.sicoob, "saude", "academia"),
    sub("Max", 34.9, 27, card.sicoob, "streaming", "max"),
  ];

  const transactions: Transaction[] = [];
  const tx = (partial: Partial<Transaction> & Pick<Transaction, "description" | "amount" | "type" | "category" | "date">): Transaction => ({
    id: uid(),
    paymentMethod: "pix_debito",
    accountId: null,
    cardId: null,
    bankSlug: null,
    isPaid: true,
    installments: 1,
    recurring: false,
    recurringEnd: null,
    paidMonths: [],
    notes: null,
    ...stamp,
    ...partial,
  });

  const start = monthsAgo(6);
  const paidUntil = (day: number) => {
    const months: string[] = [];
    for (let i = 6; i >= 1; i--) months.push(monthsAgo(i));
    if (day < todayDay) months.push(month);
    return months;
  };

  // Receitas e contas fixas (recorrentes)
  transactions.push(
    tx({ description: "Salário", amount: 4800, type: "receita", category: "salario", date: at(start, 5), accountId: acc.nubank, recurring: true, paidMonths: paidUntil(5) }),
    tx({ description: "Aluguel", amount: 1350, type: "conta_geral", category: "moradia", date: at(start, 10), accountId: acc.nubank, recurring: true, paidMonths: paidUntil(10) }),
    tx({ description: "Conta de luz", amount: 189.4, type: "conta_geral", category: "energia", date: at(start, 15), accountId: acc.inter, recurring: true, paidMonths: paidUntil(15) }),
    tx({ description: "Conta de água", amount: 78.3, type: "conta_geral", category: "agua", date: at(start, 18), accountId: acc.inter, recurring: true, paidMonths: paidUntil(18) }),
    tx({ description: "Internet fibra", amount: 99.9, type: "conta_geral", category: "internet", date: at(start, 20), paymentMethod: "cartao", cardId: card.inter, recurring: true, paidMonths: paidUntil(20) }),
    tx({ description: "Plano do celular", amount: 59.99, type: "conta_geral", category: "celular", date: at(start, 8), paymentMethod: "cartao", cardId: card.nubank, recurring: true, paidMonths: paidUntil(8) }),
  );

  // Compras parceladas
  transactions.push(
    tx({ description: "Tênis de corrida", amount: 389.9, type: "despesa_diaria", category: "compras", date: at(monthsAgo(1), 20), paymentMethod: "cartao", cardId: card.nubank, installments: 3 }),
    tx({ description: "Celular novo", amount: 1899, type: "despesa_diaria", category: "compras", date: at(monthsAgo(3), 14), paymentMethod: "cartao", cardId: card.inter, installments: 10 }),
  );

  // Mês atual
  transactions.push(
    tx({ description: "Freela de site", amount: 650, type: "receita", category: "extra", date: at(month, upToToday(12)), accountId: acc.inter }),
    tx({ description: "Mercado do mês", amount: 312.45, type: "despesa_diaria", category: "mercado", date: at(month, upToToday(6)), paymentMethod: "cartao", cardId: card.nubank }),
    tx({ description: "iFood", amount: 58.9, type: "despesa_diaria", category: "alimentacao", date: at(month, upToToday(9)), paymentMethod: "cartao", cardId: card.picpay }),
    tx({ description: "Uber", amount: 23.5, type: "despesa_diaria", category: "transporte", date: at(month, upToToday(3)), accountId: acc.nubank }),
    tx({ description: "Padaria", amount: 18, type: "despesa_diaria", category: "alimentacao", date: at(month, upToToday(4)), accountId: acc.inter }),
    tx({ description: "Combustível", amount: 200, type: "despesa_diaria", category: "carro", date: at(month, upToToday(7)), paymentMethod: "cartao", cardId: card.sicoob }),
    tx({ description: "Farmácia", amount: 47.8, type: "despesa_diaria", category: "saude", date: at(month, upToToday(11)), paymentMethod: "cartao", cardId: card.inter }),
    tx({ description: "Cinema", amount: 64, type: "despesa_diaria", category: "lazer", date: at(month, upToToday(13)), paymentMethod: "cartao", cardId: card.picpay }),
    tx({ description: "Restaurante", amount: 85, type: "despesa_diaria", category: "alimentacao", date: at(month, upToToday(14)), paymentMethod: "dinheiro" }),
    tx({ description: "Pet shop", amount: 120, type: "despesa_diaria", category: "pets", date: at(month, upToToday(2)), accountId: acc.picpay }),
  );

  // Meses anteriores (para o gráfico de evolução)
  for (let i = 1; i <= 5; i++) {
    const m = monthsAgo(i);
    const r = () => Math.round((0.75 + rand() * 0.5) * 100) / 100;
    transactions.push(
      tx({ description: "Mercado do mês", amount: Math.round(310 * r() * 100) / 100, type: "despesa_diaria", category: "mercado", date: at(m, 6), paymentMethod: "cartao", cardId: card.nubank }),
      tx({ description: "iFood", amount: Math.round(62 * r() * 100) / 100, type: "despesa_diaria", category: "alimentacao", date: at(m, 9), paymentMethod: "cartao", cardId: card.picpay }),
      tx({ description: "iFood", amount: Math.round(48 * r() * 100) / 100, type: "despesa_diaria", category: "alimentacao", date: at(m, 21), paymentMethod: "cartao", cardId: card.picpay }),
      tx({ description: "Uber", amount: Math.round(26 * r() * 100) / 100, type: "despesa_diaria", category: "transporte", date: at(m, 4), accountId: acc.nubank }),
      tx({ description: "Combustível", amount: Math.round(200 * r() * 100) / 100, type: "despesa_diaria", category: "carro", date: at(m, 7), paymentMethod: "cartao", cardId: card.sicoob }),
      tx({ description: "Lazer no fim de semana", amount: Math.round(110 * r() * 100) / 100, type: "despesa_diaria", category: "lazer", date: at(m, 16), paymentMethod: "cartao", cardId: card.picpay }),
      tx({ description: "Farmácia", amount: Math.round(45 * r() * 100) / 100, type: "despesa_diaria", category: "saude", date: at(m, 23), paymentMethod: "cartao", cardId: card.inter }),
    );
    if (i % 2 === 0) {
      transactions.push(tx({ description: "Freela", amount: 400 + Math.round(rand() * 300), type: "receita", category: "extra", date: at(m, 12), accountId: acc.inter }));
    }
  }

  const inMonths = (n: number) => toISODate(addMonths(parseISODate(today), n));
  const goals: Goal[] = [
    { id: uid(), title: "Reserva de emergência", targetAmount: 15000, currentAmount: 4200, targetDate: inMonths(14), icon: "🛡️", color: "#10b981", priority: "alta", ...stamp },
    { id: uid(), title: "Viagem para o Nordeste", targetAmount: 6000, currentAmount: 1500, targetDate: inMonths(10), icon: "✈️", color: "#0ea5e9", priority: "media", ...stamp },
    { id: uid(), title: "Notebook novo", targetAmount: 5500, currentAmount: 800, targetDate: inMonths(8), icon: "💻", color: "#8b5cf6", priority: "baixa", ...stamp },
  ];

  return { accounts, cards, subscriptions, transactions, goals };
}
