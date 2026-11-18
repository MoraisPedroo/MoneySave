import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Mês no formato "AAAA-MM". */
export type MonthKey = string;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

export function formatBRL(value: number): string {
  return brl.format(Number.isFinite(value) ? value : 0);
}

export function formatBRLCompact(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  return Math.abs(v) < 10000 ? brl.format(v) : brlCompact.format(v);
}

export function formatPercent(ratio: number): string {
  return percent.format(Number.isFinite(ratio) ? ratio : 0);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Converte "AAAA-MM-DD" em Date local (meia-noite), sem problemas de fuso. */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map((part) => parseInt(part, 10));
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function isValidISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function monthKeyOf(value: string | Date): MonthKey {
  if (typeof value === "string") return value.slice(0, 7);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}`;
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(new Date());
}

export function addMonthsKey(key: MonthKey, amount: number): MonthKey {
  const [y, m] = key.split("-").map((part) => parseInt(part, 10));
  const index = y * 12 + (m - 1) + amount;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${pad(month)}`;
}

/** Diferença em meses (to - from). */
export function monthDiff(from: MonthKey, to: MonthKey): number {
  const [fy, fm] = from.split("-").map((part) => parseInt(part, 10));
  const [ty, tm] = to.split("-").map((part) => parseInt(part, 10));
  return ty * 12 + tm - (fy * 12 + fm);
}

export function daysInMonth(key: MonthKey): number {
  const [y, m] = key.split("-").map((part) => parseInt(part, 10));
  return new Date(y, m, 0).getDate();
}

/** Data dentro do mês, respeitando meses curtos (dia 31 em fevereiro vira 28/29). */
export function dateInMonth(key: MonthKey, day: number): string {
  const safeDay = Math.min(Math.max(1, Math.round(day) || 1), daysInMonth(key));
  return `${key}-${pad(safeDay)}`;
}

export function dayOf(value: string): number {
  return parseInt(value.slice(8, 10), 10) || 1;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "Novembro de 2026" */
export function monthLabel(key: MonthKey): string {
  return capitalize(format(parseISODate(`${key}-01`), "MMMM 'de' yyyy", { locale: ptBR }));
}

/** "Novembro" */
export function monthName(key: MonthKey): string {
  return capitalize(format(parseISODate(`${key}-01`), "MMMM", { locale: ptBR }));
}

/** "nov/26" */
export function monthShort(key: MonthKey): string {
  return format(parseISODate(`${key}-01`), "MMM/yy", { locale: ptBR });
}

/** "17/11/2026" */
export function formatDateBR(value: string): string {
  return format(parseISODate(value), "dd/MM/yyyy");
}

/** "17 nov" */
export function formatDayMonth(value: string): string {
  return format(parseISODate(value), "d MMM", { locale: ptBR });
}

/** "Seg, 17 de novembro" */
export function formatWeekdayLong(value: string): string {
  return capitalize(format(parseISODate(value), "EEE, d 'de' MMMM", { locale: ptBR }));
}

/** Texto relativo de vencimento: "Hoje", "Amanhã", "Em 3 dias", "Venceu há 2 dias". */
export function relativeDue(value: string, today: string): string {
  const diff = differenceInCalendarDays(parseISODate(value), parseISODate(today));
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff > 1) return `Em ${diff} dias`;
  return `Há ${Math.abs(diff)} dias`;
}

export function daysUntil(value: string, today: string): number {
  return differenceInCalendarDays(parseISODate(value), parseISODate(today));
}
