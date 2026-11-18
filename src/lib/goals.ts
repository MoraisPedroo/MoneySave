import { addMonths, differenceInCalendarDays, differenceInMonths } from "date-fns";
import { parseISODate, toISODate } from "./format";
import type { Goal } from "./types";
import { clamp, roundMoney } from "./utils";

export interface GoalPlan {
  /** faltaGuardar = max(0, targetAmount − currentAmount) */
  remaining: number;
  progress: number;
  done: boolean;
  overdue: boolean;
  daysLeft: number;
  monthsLeft: number;
  weeksLeft: number;
  /** guardarPorMes = faltaGuardar / mesesRestantes */
  perMonth: number;
  perWeek: number;
  perDay: number;
}

/** Fórmulas do guia: quanto guardar por mês, semana e dia até a data-alvo. */
export function goalPlan(goal: Goal, today: string): GoalPlan {
  const now = parseISODate(today);
  const target = parseISODate(goal.targetDate);
  const remaining = roundMoney(Math.max(0, goal.targetAmount - goal.currentAmount));
  const daysLeft = differenceInCalendarDays(target, now);
  const monthsLeft = Math.max(1, differenceInMonths(target, now));
  const weeksLeft = Math.max(1, Math.floor(daysLeft / 7));
  const done = remaining <= 0;
  return {
    remaining,
    progress: goal.targetAmount > 0 ? clamp(goal.currentAmount / goal.targetAmount, 0, 1) : 0,
    done,
    overdue: !done && daysLeft < 0,
    daysLeft,
    monthsLeft,
    weeksLeft,
    perMonth: done ? 0 : roundMoney(remaining / monthsLeft),
    perWeek: done ? 0 : roundMoney(remaining / weeksLeft),
    perDay: done ? 0 : roundMoney(remaining / Math.max(1, daysLeft)),
  };
}

/** Simulador: guardando `monthly` por mês, em quantos meses (e em que data) a meta é atingida. */
export function simulateMonthly(goal: Goal, monthly: number, today: string): { months: number; date: string } | null {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  if (remaining <= 0) return { months: 0, date: today };
  if (!(monthly > 0)) return null;
  const months = Math.ceil(remaining / monthly);
  return { months, date: toISODate(addMonths(parseISODate(today), months)) };
}

export const PRIORITY_LABEL: Record<Goal["priority"], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const GOAL_ICONS = ["🛡️", "✈️", "🏠", "🚗", "💻", "📱", "🎓", "💍", "🏖️", "🎁", "💳", "🩺", "🐶", "👶", "🎮", "📈", "🏍️", "🎸"];

export const GOAL_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6"];
