"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { getBank } from "@/lib/banks";
import type { Card, CardBrand } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { BankPicker } from "@/components/bank/bank-picker";
import { CreditCardVisual } from "@/components/bank/credit-card-visual";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const COLORS = ["", "#111827", "#1e3a8a", "#7c3aed", "#be123c", "#047857", "#b45309", "#0f766e"];

export function CardDialog({ card, onClose }: { card?: Card; onClose: () => void }) {
  const { data, save, remove } = useFinance();
  const { confirm } = useDialogs();
  const editing = Boolean(card);

  const [bankSlug, setBankSlug] = useState(card?.bankSlug ?? "nubank");
  const [name, setName] = useState(card?.name ?? "");
  const [limit, setLimit] = useState(card?.limit ?? 0);
  const [closingDay, setClosingDay] = useState(card?.closingDay ?? 1);
  const [dueDay, setDueDay] = useState(card?.dueDay ?? 10);
  const [brand, setBrand] = useState<CardBrand>(card?.brand ?? "mastercard");
  const [last4, setLast4] = useState(card?.last4 ?? "");
  const [color, setColor] = useState(card?.color ?? "");

  const bank = getBank(bankSlug);
  const displayName = name.trim() || `Cartão ${bank.name}`;

  const handleSave = () => {
    const now = Date.now();
    const record: Card = {
      id: card?.id ?? uid(),
      name: displayName,
      bankSlug,
      limit,
      closingDay,
      dueDay,
      brand,
      last4: last4.replace(/\D/g, "").slice(-4) || null,
      color: color || null,
      createdAt: card?.createdAt ?? now,
      updatedAt: now,
    };
    save("cards", record);
    toast.success(editing ? "Cartão atualizado." : "Cartão adicionado!");
    onClose();
  };

  const handleDelete = () => {
    if (!card) return;
    const linked = data.transactions.filter((t) => t.cardId === card.id).length + data.subscriptions.filter((s) => s.cardId === card.id).length;
    confirm({
      title: `Excluir ${card.name}?`,
      description: linked
        ? `${linked} lançamento(s)/assinatura(s) usam este cartão. Eles continuam salvos, mas ficam sem cartão vinculado.`
        : "O cartão será removido.",
      confirmLabel: "Excluir cartão",
      destructive: true,
      onConfirm: () => {
        remove("cards", card.id);
        toast.success("Cartão excluído.");
      },
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cartão" : "Novo cartão de crédito"}</DialogTitle>
          <DialogDescription>Fechamento e vencimento definem em qual fatura cada compra entra.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="mx-auto w-full max-w-xs">
            <CreditCardVisual card={{ name: displayName, bankSlug, last4, brand, color: color || null }} />
          </div>

          <Field label="Banco">
            <BankPicker value={bankSlug} onChange={setBankSlug} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome do cartão" htmlFor="card-name">
              <Input id="card-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Cartão ${bank.name}`} maxLength={40} />
            </Field>
            <Field label="Limite total">
              <MoneyInput value={limit} onChange={setLimit} />
            </Field>
            <Field label="Dia de fechamento" hint="Melhor dia de compra.">
              <NativeSelect value={closingDay} onChange={(e) => setClosingDay(Number(e.target.value))}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Dia de vencimento">
              <NativeSelect value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Bandeira">
              <NativeSelect value={brand} onChange={(e) => setBrand(e.target.value as CardBrand)}>
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
                <option value="hipercard">Hipercard</option>
                <option value="outra">Outra</option>
              </NativeSelect>
            </Field>
            <Field label="Final do cartão (opcional)" htmlFor="card-last4">
              <Input id="card-last4" inputMode="numeric" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" />
            </Field>
          </div>

          <Field label="Cor do cartão">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c || "oficial"}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={color === c}
                  aria-label={c ? `Cor ${c}` : "Cor oficial do banco"}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 border-transparent text-[10px] font-semibold ring-offset-2 ring-offset-background transition",
                    color === c && "ring-2 ring-primary",
                  )}
                  style={{ background: c || `linear-gradient(135deg, ${bank.gradient[0]}, ${bank.gradient[1]})`, color: "#fff" }}
                >
                  {c ? "" : "Of."}
                </button>
              ))}
            </div>
          </Field>
        </DialogBody>
        <DialogFooter>
          {editing ? (
            <Button variant="destructive-ghost" className="sm:mr-auto" onClick={handleDelete}>
              <Trash2 /> Excluir
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>{editing ? "Salvar" : "Adicionar cartão"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
