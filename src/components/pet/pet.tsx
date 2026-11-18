import Image from "next/image";
import poupinho from "@/assets/poupinho.webp";
import { cn } from "@/lib/utils";

export type PetMood = "idle" | "happy" | "talk" | "cleaning";

/**
 * Poupinho, o assistente do MoneySave: porquinho-cofrinho 3D (ilustração gerada no Gemini,
 * com o fundo recortado). As animações (balançar, falar, pular) ficam em globals.css.
 */
export function Pet({ size = 64, mood = "idle", className }: { size?: number; mood?: PetMood; className?: string }) {
  const animation = mood === "happy" ? "animate-pet-hop" : mood === "talk" ? "animate-pet-talk" : "animate-pet-bob";
  return (
    <span className={cn("pet relative inline-block shrink-0 select-none", animation, className)} style={{ width: size, height: size }} aria-hidden>
      <Image
        src={poupinho}
        alt=""
        width={size}
        height={size}
        unoptimized
        priority={size >= 90}
        draggable={false}
        className="pointer-events-none size-full object-contain drop-shadow-[0_6px_10px_rgba(236,72,153,0.28)]"
      />
      {mood === "happy" ? (
        <>
          <span className="absolute -top-1 -left-1 animate-pet-twinkle" style={{ fontSize: size * 0.24 }}>
            ✨
          </span>
          <span className="absolute top-1 -right-1 animate-pet-twinkle [animation-delay:0.5s]" style={{ fontSize: size * 0.2 }}>
            ✨
          </span>
        </>
      ) : null}
      {mood === "cleaning" ? (
        <span className="absolute -right-2 -bottom-1 origin-bottom animate-pet-sweep" style={{ fontSize: size * 0.4 }}>
          🧹
        </span>
      ) : null}
    </span>
  );
}
