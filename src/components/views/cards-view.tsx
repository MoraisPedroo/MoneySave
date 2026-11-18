"use client";

import { useMemo } from "react";
import { CalendarClock, CreditCard, Landmark, Pencil, Plus, ShoppingBag, TriangleAlert, Wallet } from "lucide-react";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { cardOverview } from "@/lib/cards";
import { formatBRL, formatDayMonth, formatPercent } from "@/lib/format";
import { cn, sumBy } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState, Progress, Skeleton } from "@/components/ui/misc";
import { BankLogo } from "@/components/bank/bank-logo";
import { CreditCardVisual } from "@/components/bank/credit-card-visual";
import { ACCOUNT_TYPE_LABEL } from "@/components/dialogs/account-dialog";

export function CardsView() {
  const { data, today, ready } = useFinance();
  const { open } = useDialogs();

  const overviews = useMemo(
    () => (today ? data.cards.map((card) => cardOverview(card, data.transactions, data.subscriptions, today)) : []),
    [data.cards, data.transactions, data.subscriptions, today],
  );

  if (!ready) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const totalLimit = sumBy(data.cards, (c) => c.limit);
  const totalUsed = sumBy(overviews, (o) => o.used);
  const nextInvoices = sumBy(overviews, (o) => o.nextDue.total);
  const patrimony = sumBy(data.accounts, (a) => a.balance);

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Limite total" value={formatBRL(totalLimit)} icon={<CreditCard className="size-4" />} />
        <Tile
          label="Limite usado"
          value={formatBRL(totalUsed)}
          caption={totalLimit > 0 ? `${formatPercent(totalUsed / totalLimit)} do total` : undefined}
          icon={<ShoppingBag className="size-4" />}
        />
        <Tile label="Próximas faturas" value={formatBRL(nextInvoices)} caption="Soma das faturas a vencer" icon={<CalendarClock className="size-4" />} />
        <Tile label="Saldo nas contas" value={formatBRL(patrimony)} caption={`${data.accounts.length} conta(s)`} icon={<Wallet className="size-4" />} />
      </div>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Cartões de crédito</h2>
            <p className="text-sm text-muted-foreground">Toque no cartão para ver as faturas mês a mês.</p>
          </div>
          <Button onClick={() => open({ type: "card" })} data-tour="add-card">
            <Plus /> Novo cartão
          </Button>
        </div>

        {overviews.length === 0 ? (
          <EmptyState
            icon={<CreditCard />}
            title="Nenhum cartão cadastrado"
            description="Adicione seus cartões (Nubank, Inter, PicPay, Sicoob…) com limite, fechamento e vencimento para controlar as faturas."
            action={
              <Button onClick={() => open({ type: "card" })}>
                <Plus /> Adicionar cartão
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {overviews.map((ov, index) => {
              const alert = ov.usage >= 0.8;
              return (
                <Card key={ov.card.id} className="overflow-hidden" data-tour={index === 0 ? "card-item" : undefined}>
                  <button
                    type="button"
                    className="block w-full p-4 pb-0 text-left transition-transform hover:-translate-y-0.5"
                    onClick={() => open({ type: "card-details", cardId: ov.card.id })}
                    aria-label={`Ver faturas do ${ov.card.name}`}
                  >
                    <CreditCardVisual card={ov.card} />
                  </button>
                  <CardContent className="grid gap-3 pt-4">
                    <div className="grid gap-1.5">
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">Limite usado</span>
                        <span className="money font-semibold">{formatPercent(ov.usage)}</span>
                      </div>
                      <Progress
                        value={ov.usage * 100}
                        indicatorClassName={alert ? "bg-destructive" : ov.usage >= 0.6 ? "bg-warning" : undefined}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="money">Usado {formatBRL(ov.used)}</span>
                        <span className="money">Disponível {formatBRL(ov.available)}</span>
                      </div>
                    </div>
                    {alert ? (
                      <p className="flex items-center gap-1.5 rounded-lg bg-destructive-soft px-2.5 py-1.5 text-xs font-medium text-destructive">
                        <TriangleAlert className="size-3.5" /> Acima de 80% do limite — segure as compras neste cartão.
                      </p>
                    ) : null}
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-muted/50 p-2.5">
                        <dt className="text-[11px] text-muted-foreground">Próxima fatura · {formatDayMonth(ov.nextDue.dueDate)}</dt>
                        <dd className="money font-semibold">{formatBRL(ov.nextDue.total)}</dd>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-2.5">
                        <dt className="text-[11px] text-muted-foreground">Fatura aberta</dt>
                        <dd className="money font-semibold">{formatBRL(ov.openInvoice.total)}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">Fecha dia {ov.card.closingDay}</Badge>
                      <Badge variant="secondary">Vence dia {ov.card.dueDay}</Badge>
                      <Badge variant="success">Melhor dia de compra: {ov.bestPurchaseDay}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => open({ type: "card-details", cardId: ov.card.id })}>
                        <CalendarClock /> Faturas
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => open({ type: "card", card: ov.card })}>
                        <Pencil /> Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4" data-tour="accounts">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Contas e saldos</h2>
            <p className="text-sm text-muted-foreground">Contas correntes, poupança e carteiras digitais.</p>
          </div>
          <Button variant="outline" onClick={() => open({ type: "account" })}>
            <Plus /> Nova conta
          </Button>
        </div>
        {data.accounts.length === 0 ? (
          <EmptyState
            icon={<Landmark />}
            title="Nenhuma conta cadastrada"
            description="Cadastre suas contas para ver o saldo total e saber de qual banco saiu cada Pix ou débito."
            action={
              <Button variant="outline" onClick={() => open({ type: "account" })}>
                <Plus /> Adicionar conta
              </Button>
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Patrimônio nas contas</CardTitle>
                <CardDescription>Soma dos saldos informados</CardDescription>
              </div>
              <p className={cn("money text-xl font-bold", patrimony < 0 && "text-destructive")}>{formatBRL(patrimony)}</p>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {data.accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => open({ type: "account", account })}
                  className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <BankLogo slug={account.bankSlug} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABEL[account.type]}</p>
                  </div>
                  <span className={cn("money text-sm font-semibold", account.balance < 0 && "text-destructive")}>{formatBRL(account.balance)}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, caption, icon }: { label: string; value: string; caption?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">{icon}</span>
        {label}
      </div>
      <p className="money mt-2 text-lg font-semibold">{value}</p>
      {caption ? <p className="text-[11px] text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
