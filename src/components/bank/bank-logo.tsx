"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Landmark, Wallet } from "lucide-react";
import { getBank, type BankInfo } from "@/lib/banks";
import { cn, initials } from "@/lib/utils";

/* Cache global dos SVGs do pacote @edusites/bancos-brasil (carregado sob demanda) */
const glyphCache = new Map<string, string | null>();
const pending = new Set<string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function loadGlyph(key: string, slug: string, color: string) {
  if (glyphCache.has(key) || pending.has(key)) return;
  pending.add(key);
  try {
    const lib = await import("@edusites/bancos-brasil/core");
    const svg = await lib.svgBancoAsync({ nome: slug, formato: "sem", cor: color, tamanho: 64 });
    glyphCache.set(key, svg ?? null);
  } catch {
    glyphCache.set(key, null);
  } finally {
    pending.delete(key);
    listeners.forEach((listener) => listener());
  }
}

/** SVG do símbolo oficial do banco na cor pedida (null enquanto carrega ou se não existir). */
export function useBankGlyph(bank: BankInfo, color?: string) {
  const fill = color ?? bank.fg;
  const key = `${bank.slug}:${fill}`;
  const enabled = bank.kind === "curated";
  const svg = useSyncExternalStore(
    subscribe,
    () => (enabled ? (glyphCache.get(key) ?? null) : null),
    () => null,
  );
  useEffect(() => {
    if (enabled && !glyphCache.has(key)) void loadGlyph(key, bank.slug, fill);
  }, [enabled, key, bank.slug, fill]);
  return svg;
}

export function BankGlyph({ bank, color, className }: { bank: BankInfo; color?: string; className?: string }) {
  const svg = useBankGlyph(bank, color);
  if (!svg) return <span className={cn("block", className)} aria-hidden />;
  return <span className={cn("block [&>svg]:size-full", className)} aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />;
}

interface BankLogoProps {
  slug?: string | null;
  size?: number;
  shape?: "square" | "circle";
  className?: string;
}

/** Logo do banco: símbolo oficial (bancos principais), logo do Banco Central (demais) ou ícone. */
export function BankLogo(props: BankLogoProps) {
  // a key reinicia o estado de erro da imagem quando o banco muda
  return <BankLogoInner key={props.slug ?? "outro"} {...props} />;
}

function BankLogoInner({ slug, size = 36, shape = "square", className }: BankLogoProps) {
  const bank = getBank(slug);
  const svg = useBankGlyph(bank);
  const [imageFailed, setImageFailed] = useState(false);
  const radius = shape === "circle" ? "9999px" : `${Math.round(size * 0.28)}px`;
  const isWhite = bank.bg.toUpperCase() === "#FFFFFF";

  let content: React.ReactNode;
  if (bank.kind === "cash") {
    content = <Wallet style={{ width: size * 0.52, height: size * 0.52 }} />;
  } else if (bank.kind === "other") {
    content = <Landmark style={{ width: size * 0.5, height: size * 0.5 }} />;
  } else if (bank.kind === "ispb" && bank.logoUrl && !imageFailed) {
    content = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bank.logoUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setImageFailed(true)}
        className="size-[76%] object-contain"
      />
    );
  } else if (svg) {
    content = <span className="block size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />;
  } else {
    content = (
      <span className="font-semibold" style={{ fontSize: size * 0.34 }}>
        {initials(bank.name)}
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={bank.name}
      title={bank.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden select-none",
        (isWhite || bank.kind === "ispb") && "ring-1 ring-black/10 ring-inset dark:ring-white/10",
        className,
      )}
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: bank.bg, color: bank.fg }}
    >
      {content}
    </span>
  );
}
