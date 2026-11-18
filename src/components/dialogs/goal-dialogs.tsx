"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { addMonths } from "date-fns";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { formatBRL, parseISODate, toISODate } from "@/lib/format";
import { GOAL_COLORS, GOAL_ICONS, goalPlan } from "@/lib/goals";
import type { Goal, GoalPriority } from "@/lib/types";
import { cn, roundMoney, uid } from "@/lib/utils";
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
import { Field, Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/misc";

export function GoalDialog({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const { save, remove, today } = useFinance();
  const { confirm } = useDialogs();
  const editing = Boolean(goal);

  const [title, setTitle] = useState(goal?.title ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? GOAL_ICONS[0]);
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount ?? 0);
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount ?? 0);
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? toISODate(addMonths(parseISODate(today), 12)));
  const [priority, setPriority] = useState<GoalPriority>(goal?.priority ?? "media");

  const preview = useMemo(() => {
    if (!(targetAmount > 0)) return null;
    return goalPlan(
      { id: "preview", title, icon, color, targetAmount, currentAmount, targetDate, priority, createdAt: 0, updatedAt: 0 },
      today,
    );
  }, [title, icon, color, targetAmount, currentAmount, targetDate, priority, today]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Dê um nome ao objetivo.");
      return;
    }
    if (!(targetAmount > 0)) {
      toast.error("Informe o valor da meta.");
      return;
    }
    const now = Date.now();
    save("goals", {
      id: goal?.id ?? uid(),
      title: title.trim(),
      icon,
      color,
      targetAmount,
      currentAmount,
      targetDate,
      priority,
      createdAt: goal?.createdAt ?? now,
      updatedAt: now,
    });
    toast.success(editing ? "Objetivo atualizado." : "Objetivo criado! Agora é só guardar.");
    onClose();
  };

  const handleDelete = () => {
    if (!goal) return;
    confirm({
      title: `Excluir "${goal.title}"?`,
      confirmLabel: "Excluir objetivo",
      destructive: true,
      onConfirm: () => {
        remove("goals", goal.id);
        toast.success("Objetivo excluído.");
      },
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar objetivo" : "Novo objetivo"}</DialogTitle>
          <DialogDescription>Informe quanto quer juntar e até quando — o MoneySave calcula o resto.</DialogDescription>
        </DialogHeader>
        <DialogBody className="md:grid-cols-2 md:gap-x-6">
          <DialogColumn>
            <div className="flex items-end gap-3">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: `${color}22` }}
                aria-hidden
              >
                {icon}
              </span>
              <Field label="Nome do objetivo" htmlFor="goal-title" className="flex-1">
                <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Reserva de emergência" maxLength={50} />
              </Field>
            </div>
            <Field label="Ícone">
              <div className="grid grid-cols-9 gap-1">
                {GOAL_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    aria-pressed={icon === emoji}
                    className={cn("flex aspect-square items-center justify-center rounded-lg text-lg transition hover:bg-muted", icon === emoji && "bg-accent ring-2 ring-primary")}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Cor">
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                    aria-pressed={color === c}
                    className={cn("size-7 rounded-full ring-offset-2 ring-offset-background transition", color === c && "ring-2 ring-primary")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Field>
          </DialogColumn>

          <DialogColumn>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor da meta">
                <MoneyInput value={targetAmount} onChange={setTargetAmount} />
              </Field>
              <Field label="Já guardado">
                <MoneyInput value={currentAmount} onChange={setCurrentAmount} />
              </Field>
            </div>
            <Field label="Data-alvo" htmlFor="goal-date">
              <Input id="goal-date" type="date" value={targetDate} min={today} onChange={(e) => setTargetDate(e.target.value || targetDate)} />
            </Field>
            <Field label="Prioridade">
              <Segmented
                value={priority}
                onChange={setPriority}
                options={[
                  { value: "alta", label: "Alta" },
                  { value: "media", label: "Média" },
                  { value: "baixa", label: "Baixa" },
                ]}
              />
            </Field>
            {preview && !preview.done ? (
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-accent/60 p-3 text-center">
                <div>
                  <p className="text-[11px] text-muted-foreground">Por mês</p>
                  <p className="money text-sm font-semibold">{formatBRL(preview.perMonth)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Por semana</p>
                  <p className="money text-sm font-semibold">{formatBRL(preview.perWeek)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Por dia</p>
                  <p className="money text-sm font-semibold">{formatBRL(preview.perDay)}</p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">
                Informe o valor da meta para ver quanto guardar por mês, semana e dia.
              </p>
            )}
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
          <Button onClick={handleSave}>{editing ? "Salvar" : "Criar objetivo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DepositDialog({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { save, today } = useFinance();
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState(0);
  const plan = goalPlan(goal, today);
  const suggestions = [
    { label: "Valor do mês", value: plan.perMonth },
    { label: "Valor da semana", value: plan.perWeek },
    { label: "Tudo o que falta", value: plan.remaining },
  ].filter((item, index, list) => item.value > 0 && list.findIndex((other) => other.value === item.value) === index);

  const handleSave = () => {
    if (!(amount > 0)) {
      toast.error("Informe o valor.");
      return;
    }
    const next = roundMoney(Math.max(0, goal.currentAmount + (direction === "add" ? amount : -amount)));
    save("goals", { ...goal, currentAmount: next });
    if (direction === "add" && next >= goal.targetAmount) toast.success(`🎉 Meta "${goal.title}" alcançada!`);
    else toast.success(direction === "add" ? `${formatBRL(amount)} guardados em "${goal.title}".` : `${formatBRL(amount)} retirados de "${goal.title}".`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {goal.icon} {goal.title}
          </DialogTitle>
          <DialogDescription>
            Guardado: {formatBRL(goal.currentAmount)} de {formatBRL(goal.targetAmount)}
            {!plan.done ? ` · faltam ${formatBRL(plan.remaining)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Segmented
            value={direction}
            onChange={setDirection}
            options={[
              { value: "add", label: "Guardar", icon: <Plus /> },
              { value: "remove", label: "Retirar", icon: <Minus /> },
            ]}
          />
          <MoneyInput value={amount} onChange={setAmount} size="lg" autoFocus aria-label="Valor" />
          {direction === "add" && !plan.done ? (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setAmount(item.value)}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {item.label}: {formatBRL(item.value)}
                </button>
              ))}
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>{direction === "add" ? "Guardar" : "Retirar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
