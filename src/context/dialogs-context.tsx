"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { MonthKey } from "@/lib/format";
import type { Account, Card, Goal, Subscription, Transaction } from "@/lib/types";

export type DialogRequest =
  | { type: "transaction"; transaction?: Transaction; defaults?: Partial<Transaction>; month?: MonthKey }
  | { type: "card"; card?: Card }
  | { type: "card-details"; cardId: string }
  | { type: "account"; account?: Account }
  | { type: "subscription"; subscription?: Subscription }
  | { type: "goal"; goal?: Goal }
  | { type: "deposit"; goal: Goal }
  | {
      type: "confirm";
      title: string;
      description?: string;
      confirmLabel?: string;
      destructive?: boolean;
      onConfirm: () => void | Promise<void>;
    };

type StackEntry = DialogRequest & { key: number };

interface DialogsContextValue {
  /** janela visível (topo da pilha) */
  current: StackEntry | null;
  /** abre uma janela por cima da atual */
  open: (request: DialogRequest) => void;
  /** fecha a janela do topo (volta para a anterior, se houver) */
  close: () => void;
  /** fecha todas as janelas */
  closeAll: () => void;
  confirm: (options: Omit<Extract<DialogRequest, { type: "confirm" }>, "type">) => void;
}

const DialogsContext = createContext<DialogsContextValue | null>(null);

let counter = 0;

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<StackEntry[]>([]);

  const open = useCallback((request: DialogRequest) => {
    counter += 1;
    setStack((prev) => [...prev, { ...request, key: counter }]);
  }, []);

  const close = useCallback(() => setStack((prev) => prev.slice(0, -1)), []);
  const closeAll = useCallback(() => setStack((prev) => (prev.length ? [] : prev)), []);

  const confirm = useCallback<DialogsContextValue["confirm"]>(
    (options) => open({ type: "confirm", ...options }),
    [open],
  );

  const current = stack.length ? stack[stack.length - 1] : null;
  const value = useMemo(() => ({ current, open, close, closeAll, confirm }), [current, open, close, closeAll, confirm]);
  return <DialogsContext.Provider value={value}>{children}</DialogsContext.Provider>;
}

export function useDialogs() {
  const context = useContext(DialogsContext);
  if (!context) throw new Error("useDialogs precisa estar dentro de <DialogsProvider>");
  return context;
}
