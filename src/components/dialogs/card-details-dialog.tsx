"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Repeat } from "lucide-react";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { cardOverview, type InvoiceStatus } from "@/lib/cards";
import { formatBRL, formatDateBR, formatDayMonth, monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge, Progress } from "@/components/ui/misc";
import { CreditCardVisual } from "@/components/bank/credit-card-visual";

const STATUS: Record<InvoiceStatus, { label: string; variant: "success" | "warning" | "secondary" }> = {
  aberta: { label: "Aberta", variant: "success" },
  fechada: { label: "Fechada", variant: "warning" },
  vencida: { label: "Paga/vencida", variant: "secondary" },
  futura: { label: "Futura", variant: "secondary" },
};

export function CardDetailsDialog({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const { data, today } = useFinance();
  const { open } = useDialogs();
  const card = data.cards.find((c) => c.id === cardId);
  const overview = useMemo(
    () => (card ? cardOverview(card, data.transactions, data.subscriptions, today) : null),
    [card, data.transactions, data.subscriptions, today],
  );
  const upcoming = overview ? overview.invoices.filter((inv) => inv.status !== "vencida" || inv.total > 0).slice(0, 8) : [];
  const [selected, setSelected] = useState(() => overview?.nextDue.dueMonth ?? "");

  if (!card || !overview) return null;
  const invoice = overview.invoices.find((inv) => inv.dueMonth === selected) ?? overview.nextDue;

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
          <DialogDescription>
            Fecha dia {card.closingDay} · vence dia {card.dueDay} · melhor dia de compra: {overview.bestPurchaseDay}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-4 sm:grid-cols-[15rem_1fr]">
            <CreditCardVisual card={card} size="sm" />
            <div className="grid content-center gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Limite usado</span>
                <span className="money font-semibold">
                  {formatBRL(overview.used)} <span className="font-normal text-muted-foreground">de {formatBRL(card.limit)}</span>
                </span>
              </div>
              <Progress
                value={overview.usage * 100}
                indicatorClassName={cn(overview.usage >= 0.8 ? "bg-destructive" : overview.usage >= 0.6 ? "bg-warning" : "bg-primary")}
              />
              <p className="text-xs text-muted-foreground">
                Disponível: <span className="money font-medium text-foreground">{formatBRL(overview.available)}</span>
                {overview.usage >= 0.8 ? " · atenção: acima de 80% do limite" : ""}
              </p>
            </div>
          </div>

          <div className="scrollbar-none -mx-1 flex min-h-max gap-2 overflow-x-auto px-1 pb-1">
            {upcoming.map((inv) => (
              <button
                key={inv.dueMonth}
                type="button"
                onClick={() => setSelected(inv.dueMonth)}
                className={cn(
                  "flex min-w-32 shrink-0 flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors hover:bg-muted",
                  inv.dueMonth === invoice.dueMonth && "border-primary bg-accent",
                )}
              >
                <span className="text-xs text-muted-foreground">Vence {formatDayMonth(inv.dueDate)}</span>
                <span className="money text-sm font-semibold">{formatBRL(inv.total)}</span>
                <Badge variant={STATUS[inv.status].variant}>{STATUS[inv.status].label}</Badge>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <p className="font-semibold">Fatura de {monthLabel(invoice.dueMonth).toLowerCase()}</p>
                <p className="text-xs text-muted-foreground">
                  Fecha {formatDateBR(invoice.closingDate)} · vence {formatDateBR(invoice.dueDate)}
                </p>
              </div>
              <p className="money text-lg font-semibold">{formatBRL(invoice.total)}</p>
            </div>
            {invoice.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma compra nesta fatura.</p>
            ) : (
              <ul className="divide-y">
                {invoice.items.map((item) => (
                  <li key={item.key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBR(item.date)}
                        {item.installment ? ` · parcela ${item.installment.index}/${item.installment.total}` : ""}
                      </p>
                    </div>
                    {item.kind === "assinatura" ? (
                      <Badge variant="secondary">
                        <Repeat /> Assinatura
                      </Badge>
                    ) : null}
                    <span className="money font-medium">{formatBRL(item.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" className="sm:mr-auto" onClick={() => open({ type: "card", card })}>
            <Pencil /> Editar cartão
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              open({
                type: "transaction",
                defaults: { type: "despesa_diaria", paymentMethod: "cartao", cardId: card.id, description: "Saldo anterior da fatura", category: "outros" },
              })
            }
          >
            <Plus /> Lançar compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
