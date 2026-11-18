"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { getBank } from "@/lib/banks";
import type { Account, AccountType } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { BankPicker } from "@/components/bank/bank-picker";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  pagamento: "Conta de pagamento",
  investimento: "Investimentos",
  carteira: "Carteira / dinheiro",
};

export function AccountDialog({ account, onClose }: { account?: Account; onClose: () => void }) {
  const { save, remove } = useFinance();
  const { confirm } = useDialogs();
  const editing = Boolean(account);

  const [bankSlug, setBankSlug] = useState(account?.bankSlug ?? "nubank");
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "corrente");
  const [balance, setBalance] = useState(account?.balance ?? 0);

  const bank = getBank(bankSlug);

  const handleSave = () => {
    const now = Date.now();
    save("accounts", {
      id: account?.id ?? uid(),
      name: name.trim() || (bankSlug === "dinheiro" ? "Carteira" : `Conta ${bank.name}`),
      bankSlug,
      type: bankSlug === "dinheiro" ? "carteira" : type,
      balance,
      color: account?.color ?? null,
      createdAt: account?.createdAt ?? now,
      updatedAt: now,
    });
    toast.success(editing ? "Conta atualizada." : "Conta adicionada!");
    onClose();
  };

  const handleDelete = () => {
    if (!account) return;
    confirm({
      title: `Excluir ${account.name}?`,
      description: "Lançamentos ligados a esta conta continuam salvos.",
      confirmLabel: "Excluir conta",
      destructive: true,
      onConfirm: () => {
        remove("accounts", account.id);
        toast.success("Conta excluída.");
      },
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar conta" : "Nova conta bancária"}</DialogTitle>
          <DialogDescription>O saldo informado entra no seu patrimônio total.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Banco">
            <BankPicker value={bankSlug} onChange={setBankSlug} allowCash />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" htmlFor="acc-name">
              <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Conta ${bank.name}`} maxLength={40} />
            </Field>
            <Field label="Tipo">
              <NativeSelect value={type} onChange={(e) => setType(e.target.value as AccountType)} disabled={bankSlug === "dinheiro"}>
                {Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Saldo atual" hint="Use ± para saldo negativo (cheque especial).">
            <MoneyInput value={balance} onChange={setBalance} allowNegative size="lg" />
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
          <Button onClick={handleSave}>{editing ? "Salvar" : "Adicionar conta"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
