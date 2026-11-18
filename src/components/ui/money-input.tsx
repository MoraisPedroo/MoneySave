"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "./input";

const formatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Campo de valor em reais no estilo dos apps de banco: os dígitos digitados
 * preenchem os centavos (1 → 0,01 → 0,12 → 1,23...).
 */
export function MoneyInput({
  value,
  onChange,
  className,
  size = "default",
  allowNegative = false,
  autoFocus,
  id,
  placeholder,
  "aria-label": ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  size?: "default" | "lg";
  allowNegative?: boolean;
  autoFocus?: boolean;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const negative = allowNegative && value < 0;
  const display = value === 0 && placeholder ? "" : formatter.format(Math.abs(value));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 13);
    const cents = digits ? parseInt(digits, 10) : 0;
    // digitar "-" inverte o sinal (quando permitido)
    const nextNegative = allowNegative && (raw.includes("-") ? !negative : negative);
    onChange((nextNegative ? -cents : cents) / 100);
  };

  return (
    <div className={cn("relative", className)}>
      {allowNegative ? (
        <button
          type="button"
          onClick={() => onChange(-value)}
          className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
          aria-label="Inverter sinal"
        >
          ±
        </button>
      ) : null}
      <span
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-medium text-muted-foreground",
          size === "lg" ? "text-lg" : "text-sm",
        )}
      >
        {negative ? "−R$" : "R$"}
      </span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        placeholder={placeholder ?? "0,00"}
        value={display}
        onChange={handleChange}
        onFocus={(event) => {
          const input = event.currentTarget;
          requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
        }}
        className={cn(
          fieldBase,
          "money text-right",
          size === "lg" ? "h-14 pl-12 text-2xl font-semibold" : "h-10 pl-10",
          allowNegative && "pr-10",
        )}
      />
    </div>
  );
}
