"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { CASH_BANK, INSTITUTION_COUNT, getBank, searchBanks } from "@/lib/banks";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { BankLogo } from "./bank-logo";

/** Seletor de banco com logos: destaques (Nubank, Inter, PicPay, Sicoob...) + busca no Banco Central. */
export function BankPicker({
  value,
  onChange,
  allowCash = false,
}: {
  value: string;
  onChange: (slug: string) => void;
  allowCash?: boolean;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const list = searchBanks(query, 48);
    if (allowCash && !query) return [CASH_BANK, ...list];
    return list;
  }, [query, allowCash]);
  const selected = getBank(value);
  const selectedInList = results.some((bank) => bank.slug === value);

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Buscar entre ${INSTITUTION_COUNT}+ bancos e fintechs`}
          className="pl-9"
          aria-label="Buscar banco"
        />
      </div>
      <div className="grid max-h-[9.5rem] grid-cols-4 gap-1 overflow-y-auto rounded-xl border bg-muted/30 p-1 sm:grid-cols-5">
        {!selectedInList && value ? <BankTile slug={selected.slug} name={selected.name} active onSelect={onChange} /> : null}
        {results.map((bank) => (
          <BankTile key={bank.slug} slug={bank.slug} name={bank.name} active={bank.slug === value} onSelect={onChange} />
        ))}
        {results.length === 0 ? (
          <p className="col-span-full px-2 py-6 text-center text-sm text-muted-foreground">Nenhuma instituição encontrada.</p>
        ) : null}
      </div>
    </div>
  );
}

function BankTile({ slug, name, active, onSelect }: { slug: string; name: string; active: boolean; onSelect: (slug: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(slug)}
      aria-pressed={active}
      title={name}
      className={cn(
        "relative flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center transition-colors outline-none hover:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/40",
        active && "bg-card shadow-sm ring-2 ring-primary",
      )}
    >
      <BankLogo slug={slug} size={30} />
      <span className="line-clamp-1 w-full text-[10.5px] leading-tight font-medium">{name}</span>
      {active ? (
        <span className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-2.5" />
        </span>
      ) : null}
    </button>
  );
}
