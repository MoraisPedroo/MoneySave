import { sanitizeData } from "./backup";
import type { FinanceData } from "./types";

const DATA_KEY = "moneysave:data:v1";
const MODE_KEY = "moneysave:mode";

export function readLocalMode(): boolean {
  try {
    return localStorage.getItem(MODE_KEY) === "local";
  } catch {
    return false;
  }
}

export function writeLocalMode(active: boolean) {
  try {
    if (active) localStorage.setItem(MODE_KEY, "local");
    else localStorage.removeItem(MODE_KEY);
  } catch {
    /* armazenamento indisponível (ex.: aba anônima) */
  }
}

export function readLocalData(): FinanceData | null {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    return sanitizeData(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLocalData(data: FinanceData): boolean {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalData() {
  try {
    localStorage.removeItem(DATA_KEY);
  } catch {
    /* ignora */
  }
}

export function hasLocalData(): boolean {
  const data = readLocalData();
  if (!data) return false;
  return Object.values(data).some((list) => list.length > 0);
}
