"use client";

import { Wifi } from "lucide-react";
import { getBank } from "@/lib/banks";
import type { Card } from "@/lib/types";
import { cn, readableOn } from "@/lib/utils";
import { BankGlyph, BankLogo } from "./bank-logo";

const BRAND_LABEL: Record<string, string> = {
  visa: "VISA",
  mastercard: "mastercard",
  elo: "elo",
  amex: "AMEX",
  hipercard: "Hipercard",
  outra: "",
};

/** Cartão de crédito desenhado com a cor e o símbolo oficial do banco. */
export function CreditCardVisual({
  card,
  className,
  size = "default",
}: {
  card: Pick<Card, "name" | "bankSlug" | "last4" | "brand" | "color">;
  className?: string;
  size?: "default" | "sm";
}) {
  const bank = getBank(card.bankSlug);
  const from = card.color || bank.gradient[0];
  const to = card.color ? `color-mix(in oklch, ${card.color} 62%, black)` : bank.gradient[1];
  const text = readableOn(from);
  const brand = card.brand ? BRAND_LABEL[card.brand] : "";

  return (
    <div
      className={cn(
        "relative isolate aspect-[1.586/1] w-full overflow-hidden rounded-2xl shadow-lg shadow-black/15 select-none",
        size === "sm" ? "p-3" : "p-4 sm:p-5",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, color: text }}
    >
      {/* brilhos decorativos */}
      <div className="pointer-events-none absolute -top-1/3 -right-1/4 -z-10 aspect-square w-3/4 rounded-full bg-white/10 blur-[2px]" />
      <div className="pointer-events-none absolute -bottom-1/2 -left-1/4 -z-10 aspect-square w-3/4 rounded-full bg-black/10" />

      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {bank.kind === "curated" ? (
              <BankGlyph bank={bank} color={text} className={size === "sm" ? "size-7" : "size-9"} />
            ) : (
              <BankLogo slug={card.bankSlug} size={size === "sm" ? 26 : 32} />
            )}
            <span className={cn("truncate font-semibold opacity-90", size === "sm" ? "text-xs" : "text-sm")}>{bank.name}</span>
          </div>
          <Wifi className={cn("shrink-0 rotate-90 opacity-70", size === "sm" ? "size-4" : "size-5")} />
        </div>

        <div
          className={cn("rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 shadow-inner", size === "sm" ? "h-5 w-7" : "h-7 w-10")}
          aria-hidden
        />

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className={cn("truncate font-medium opacity-90", size === "sm" ? "text-[11px]" : "text-sm")}>{card.name}</p>
            <p className={cn("money font-mono tracking-widest opacity-80", size === "sm" ? "text-[10px]" : "text-xs")}>
              •••• {card.last4 || "••••"}
            </p>
          </div>
          {brand ? (
            <span className={cn("shrink-0 font-bold tracking-tight italic opacity-90", size === "sm" ? "text-xs" : "text-base")}>{brand}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
