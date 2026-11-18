"use client";

import { useState } from "react";
import { CreditCard, Landmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { SUBSCRIPTION_CATEGORIES } from "@/lib/categories";
import { CYCLE_LABEL, monthlyEquivalent } from "@/lib/finance";
import { dayOf, formatBRL } from "@/lib/format";
import { SERVICE_PRESETS, guessService } from "@/lib/services";
import type { BillingCycle, Subscription } from "@/lib/types";
import { cn, readableOn, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogColumn,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { CategorySelect } from "@/components/ui/category-select";
import { Segmented, Switch } from "@/components/ui/misc";
import { BankLogo } from "@/components/bank/bank-logo";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const chip = "inline-flex max-w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted";

export function SubscriptionDialog({ subscription, onClose }: { subscription?: Subscription; onClose: () => void }) {
  const { data, save, remove, today } = useFinance();
  const { confirm } = useDialogs();
  const editing = Boolean(subscription);

  const [name, setName] = useState(subscription?.name ?? "");
  const [serviceSlug, setServiceSlug] = useState<string | null>(subscription?.serviceSlug ?? null);
  const [amount, setAmount] = useState(subscription?.amount ?? 0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billingCycle ?? "mensal");
  const [billingDay, setBillingDay] = useState(subscription?.billingDay ?? dayOf(today));
  const [startDate, setStartDate] = useState(subscription?.startDate ?? today);
  const [paymentMethod, setPaymentMethod] = useState<"cartao" | "pix_debito">(
    subscription?.paymentMethod ?? (data.cards.length ? "cartao" : "pix_debito"),
  );
  const [cardId, setCardId] = useState(subscription?.cardId ?? data.cards[0]?.id ?? "");
  const [accountId, setAccountId] = useState(subscription?.accountId ?? data.accounts[0]?.id ?? "");
  const [category, setCategory] = useState(subscription?.category ?? "streaming");
  const [active, setActive] = useState(subscription?.active ?? true);

  const pickService = (slug: string) => {
    const service = SERVICE_PRESETS.find((s) => s.slug === slug);
    if (!service) return;
    setServiceSlug(service.slug);
    setName(service.name);
    setCategory(service.category);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Informe o nome da assinatura.");
      return;
    }
    if (!(amount > 0)) {
      toast.error("Informe o valor cobrado.");
      return;
    }
    const now = Date.now();
    const usesCard = paymentMethod === "cartao" && Boolean(cardId);
    const service = serviceSlug ?? guessService(name)?.slug ?? null;
    save("subscriptions", {
      id: subscription?.id ?? uid(),
      name: name.trim(),
      amount,
      billingCycle,
      billingDay,
      startDate,
      paymentMethod: usesCard ? "cartao" : "pix_debito",
      cardId: usesCard ? cardId : null,
      accountId: usesCard ? null : accountId || null,
      bankSlug: usesCard
        ? (data.cards.find((c) => c.id === cardId)?.bankSlug ?? null)
        : (data.accounts.find((a) => a.id === accountId)?.bankSlug ?? null),
      category,
      serviceSlug: service,
      active,
      createdAt: subscription?.createdAt ?? now,
      updatedAt: now,
    });
    toast.success(editing ? "Assinatura atualizada." : "Assinatura adicionada ao radar!");
    onClose();
  };

  const handleDelete = () => {
    if (!subscription) return;
    confirm({
      title: `Excluir ${subscription.name}?`,
      description: "Ela sai do radar e dos cálculos do mês. Para só pausar, desative a assinatura.",
      confirmLabel: "Excluir",
      destructive: true,
      onConfirm: () => {
        remove("subscriptions", subscription.id);
        toast.success("Assinatura excluída.");
      },
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
          <DialogDescription>Streaming, apps, academia, clubes… tudo o que é cobrado automaticamente.</DialogDescription>
        </DialogHeader>
        <DialogBody className="md:grid-cols-2 md:gap-x-6">
          {!editing ? (
            <div className="grid gap-1.5 md:col-span-2">
              <span className="text-[13px] font-medium text-muted-foreground">Atalhos</span>
              <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                {SERVICE_PRESETS.map((service) => (
                  <button
                    key={service.slug}
                    type="button"
                    onClick={() => pickService(service.slug)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted",
                      serviceSlug === service.slug && "border-transparent",
                    )}
                    style={serviceSlug === service.slug ? { backgroundColor: service.color, color: readableOn(service.color) } : undefined}
                  >
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: service.color }} />
                    {service.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <DialogColumn>
            <Field label="Nome" htmlFor="sub-name">
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setServiceSlug(null);
                }}
                placeholder="Ex.: Netflix Padrão"
                maxLength={50}
              />
            </Field>
            <Field label="Valor por cobrança">
              <MoneyInput value={amount} onChange={setAmount} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ciclo">
                <NativeSelect value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}>
                  {Object.entries(CYCLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Dia da cobrança">
                <NativeSelect value={billingDay} onChange={(e) => setBillingDay(Number(e.target.value))}>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field
              label={billingCycle === "mensal" ? "Assinante desde" : "Data da 1ª cobrança"}
              htmlFor="sub-start"
              hint={
                billingCycle !== "mensal" && amount > 0
                  ? `Equivale a ${formatBRL(monthlyEquivalent({ amount, billingCycle }))}/mês no seu orçamento.`
                  : undefined
              }
            >
              <Input id="sub-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value || today)} />
            </Field>
          </DialogColumn>

          <DialogColumn>
            <Field label="Categoria" htmlFor="sub-category">
              <CategorySelect id="sub-category" value={category} onChange={setCategory} categories={SUBSCRIPTION_CATEGORIES} />
            </Field>
            <Field label="Cobrada em">
              <Segmented
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: "cartao", label: "Cartão de crédito", icon: <CreditCard /> },
                  { value: "pix_debito", label: "Conta / débito", icon: <Landmark /> },
                ]}
              />
            </Field>
            {paymentMethod === "cartao" ? (
              data.cards.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.cards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCardId(c.id)}
                      aria-pressed={c.id === cardId}
                      className={cn(chip, c.id === cardId && "border-primary bg-accent font-medium")}
                    >
                      <BankLogo slug={c.bankSlug} size={22} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cadastre um cartão em Cartões e contas para vincular.</p>
              )
            ) : data.accounts.length ? (
              <div className="flex flex-wrap gap-1.5">
                {data.accounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAccountId(a.id)}
                    aria-pressed={a.id === accountId}
                    className={cn(chip, a.id === accountId && "border-primary bg-accent font-medium")}
                  >
                    <BankLogo slug={a.bankSlug} size={22} />
                    <span className="truncate">{a.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Cadastre uma conta em Cartões e contas para vincular.</p>
            )}
            <label className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <span>
                <span className="block text-sm font-medium">Assinatura ativa</span>
                <span className="block text-xs text-muted-foreground">Desative quando cancelar (o histórico fica salvo).</span>
              </span>
              <Switch checked={active} onCheckedChange={setActive} />
            </label>
          </DialogColumn>
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
          <Button onClick={handleSave}>{editing ? "Salvar" : "Adicionar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
