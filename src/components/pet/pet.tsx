import { cn } from "@/lib/utils";

export type PetMood = "idle" | "happy" | "talk" | "cleaning";

/**
 * Poupinho, o assistente do MoneySave: um cofrinho de porquinho desenhado em SVG.
 * As animações (balançar, piscar, pular) ficam em globals.css.
 */
export function Pet({ size = 64, mood = "idle", className }: { size?: number; mood?: PetMood; className?: string }) {
  const happy = mood === "happy";
  return (
    <span
      className={cn("pet relative inline-block shrink-0 select-none", happy ? "animate-pet-hop" : "animate-pet-bob", className)}
      style={{ width: size, height: size * 0.92 }}
      aria-hidden
    >
      <svg viewBox="0 0 120 110" className="size-full overflow-visible drop-shadow-sm">
        <defs>
          <linearGradient id="pet-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffc2dc" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="pet-coin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* sombra */}
        <ellipse cx="60" cy="104" rx="32" ry="4.5" fill="#000" opacity="0.12" />

        {/* moeda caindo no cofrinho */}
        {happy || mood === "talk" ? (
          <g className="animate-pet-coin">
            <circle cx="60" cy="10" r="8" fill="url(#pet-coin)" stroke="#d97706" strokeWidth="1.5" />
            <text x="60" y="13.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#92400e">$</text>
          </g>
        ) : null}

        {/* perninhas */}
        <rect x="30" y="84" width="12" height="16" rx="5" fill="#ec4899" />
        <rect x="46" y="88" width="11" height="13" rx="5" fill="#db2777" />
        <rect x="64" y="88" width="11" height="13" rx="5" fill="#db2777" />
        <rect x="79" y="84" width="12" height="16" rx="5" fill="#ec4899" />

        {/* rabinho */}
        <path d="M103 60c8-3 11 5 5 8-5 2-4-6 2-6" fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />

        {/* orelhas */}
        <path d="M30 40 L26 16 L50 30 Z" fill="#f472b6" stroke="#ec4899" strokeWidth="2" strokeLinejoin="round" />
        <path d="M33 35 L31 22 L44 30 Z" fill="#fbcfe8" />
        <path d="M90 40 L94 16 L70 30 Z" fill="#f472b6" stroke="#ec4899" strokeWidth="2" strokeLinejoin="round" />
        <path d="M87 35 L89 22 L76 30 Z" fill="#fbcfe8" />

        {/* corpo */}
        <ellipse cx="60" cy="60" rx="45" ry="35" fill="url(#pet-body)" stroke="#ec4899" strokeWidth="2" />
        <ellipse cx="44" cy="42" rx="14" ry="6" fill="#fff" opacity="0.35" />

        {/* fenda da moeda */}
        <rect x="51" y="27" width="18" height="4.5" rx="2.25" fill="#9d174d" />

        {/* olhos */}
        <g className="animate-pet-blink" style={{ transformOrigin: "60px 52px" }}>
          <circle cx="44" cy="52" r="5" fill="#1f2937" />
          <circle cx="76" cy="52" r="5" fill="#1f2937" />
          <circle cx="45.8" cy="50.2" r="1.7" fill="#fff" />
          <circle cx="77.8" cy="50.2" r="1.7" fill="#fff" />
        </g>

        {/* bochechas */}
        <ellipse cx="33" cy="64" rx="7" ry="4.5" fill="#fb7185" opacity="0.45" />
        <ellipse cx="87" cy="64" rx="7" ry="4.5" fill="#fb7185" opacity="0.45" />

        {/* focinho */}
        <ellipse cx="60" cy="66" rx="13" ry="9.5" fill="#f9a8d4" stroke="#ec4899" strokeWidth="2" />
        <ellipse cx="55.5" cy="66" rx="2.3" ry="3.3" fill="#be185d" />
        <ellipse cx="64.5" cy="66" rx="2.3" ry="3.3" fill="#be185d" />

        {/* boca */}
        {happy || mood === "talk" ? (
          <path d="M53 79 Q60 86 67 79" fill="#be185d" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" />
        ) : (
          <path d="M54 79 Q60 83 66 79" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* vassourinha (limpando os dados de exemplo) */}
        {mood === "cleaning" ? (
          <g className="animate-pet-sweep" style={{ transformOrigin: "102px 96px" }}>
            <rect x="99" y="44" width="4" height="46" rx="2" fill="#a16207" transform="rotate(18 101 67)" />
            <path d="M96 86 L116 92 L112 104 L92 98 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          </g>
        ) : null}
      </svg>
    </span>
  );
}

/** Balão de fala do Poupinho. */
export function SpeechBubble({ children, className, tail = "left" }: { children: React.ReactNode; className?: string; tail?: "left" | "right" | "none" }) {
  return (
    <div className={cn("relative rounded-2xl border bg-popover p-3.5 text-sm text-popover-foreground shadow-xl", className)}>
      {tail !== "none" ? (
        <span
          className={cn(
            "absolute -bottom-2 size-4 rotate-45 border-r border-b bg-popover",
            tail === "left" ? "left-6" : "right-6",
          )}
          aria-hidden
        />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}
