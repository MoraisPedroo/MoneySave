"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CircleCheck, Sparkles } from "lucide-react";
import { useFinance } from "@/context/finance-context";
import { useTutorial } from "@/context/tutorial-context";
import { Button } from "@/components/ui/button";
import { Pet } from "@/components/pet/pet";

/** Camada do tutorial: convite inicial, tour guiado, encerramento e limpeza dos dados de exemplo. */
export function TutorialLayer() {
  const { running, phase, welcomeVisible } = useTutorial();
  if (welcomeVisible) return <Welcome />;
  if (!running) return null;
  if (phase === "finale") return <Finale />;
  if (phase === "cleaning") return <Cleaning />;
  return <TourOverlay />;
}

function Backdrop({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
      {children}
    </div>,
    document.body,
  );
}

function Welcome() {
  const { user } = useFinance();
  const { start, dismissWelcome } = useTutorial();
  const firstName = user?.name.split(" ")[0] ?? "";
  return (
    <Backdrop>
      <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="w-full max-w-md animate-pop-in rounded-3xl border bg-popover p-6 text-center shadow-2xl">
        <Pet size={104} mood="talk" className="mx-auto" />
        <h2 id="welcome-title" className="mt-3 text-2xl font-bold tracking-tight">
          {firstName ? `Olá, ${firstName}!` : "Olá!"} Eu sou o Poupinho 🐷
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sou seu assistente no MoneySave. Quer um tour rápido? Eu preencho o app com <strong>dados de exemplo</strong> para te mostrar
          como tudo funciona — e apago tudo no final.
        </p>
        <div className="mt-6 grid gap-2">
          <Button size="lg" onClick={start}>
            <Sparkles /> Começar tutorial
          </Button>
          <Button variant="ghost" onClick={dismissWelcome}>
            Pular, quero começar agora
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">O tutorial também fica em Ajustes, para ver quando quiser.</p>
      </div>
    </Backdrop>
  );
}

function Finale() {
  const { isRealDataEmpty } = useFinance();
  const { finish, backToTour } = useTutorial();
  return (
    <Backdrop>
      <div role="dialog" aria-modal="true" aria-labelledby="finale-title" className="w-full max-w-md animate-pop-in rounded-3xl border bg-popover p-6 shadow-2xl">
        <Pet size={96} mood="happy" className="mx-auto block" />
        <h2 id="finale-title" className="mt-3 text-center text-2xl font-bold tracking-tight">
          Prontinho! 🎉
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">Agora você já conhece o MoneySave.</p>
        <ul className="mt-5 grid gap-2.5 text-sm">
          <li className="flex gap-2.5">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              {isRealDataEmpty
                ? "Vou apagar os dados de exemplo para você começar do zero, com os seus dados."
                : "Vou tirar os dados de exemplo e trazer seus dados de volta."}
            </span>
          </li>
          <li className="flex gap-2.5">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              O tutorial só aparece de novo se você ativar em <strong>Ajustes › Tutorial</strong>.
            </span>
          </li>
          <li className="flex gap-2.5">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Na tela inicial tem um checklist com 4 passos — eu te acompanho até 100%!</span>
          </li>
        </ul>
        <div className="mt-6 grid gap-2">
          <Button size="lg" onClick={finish}>
            <Sparkles /> Limpar exemplo e começar
          </Button>
          <Button variant="ghost" onClick={backToTour}>
            <ChevronLeft /> Voltar ao tour
          </Button>
        </div>
      </div>
    </Backdrop>
  );
}

function Cleaning() {
  return (
    <Backdrop>
      <div role="status" aria-live="polite" className="w-full max-w-sm animate-pop-in rounded-3xl border bg-popover p-6 text-center shadow-2xl">
        <Pet size={96} mood="cleaning" className="mx-auto" />
        <p className="mt-4 text-lg font-semibold">Limpando os dados de exemplo…</p>
        <p className="text-sm text-muted-foreground">Só um instante 🧹</p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary [animation:fill-bar_1.7s_ease-in-out_forwards]" />
        </div>
      </div>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ */
/* Tour com destaque (spotlight) no elemento de cada passo             */
/* ------------------------------------------------------------------ */

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findTarget(name: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

const BUBBLE_WIDTH = 360;

function TourOverlay() {
  const { step, stepIndex, steps, next, prev, skip } = useTutorial();
  const { data, cuts } = useFinance();
  const router = useRouter();
  const pathname = usePathname();
  const [measure, setMeasure] = useState<{ key: string; rect: Rect; vw: number; vh: number } | null>(null);

  // leva para a página do passo
  useEffect(() => {
    if (pathname !== step.route) router.push(step.route);
  }, [pathname, step.route, router]);

  // acompanha a posição do elemento destacado (rolagem, troca de página, redimensionamento)
  useEffect(() => {
    let frame = 0;
    let scrolled = false;
    let signature = "";
    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const el = step.target ? findTarget(step.target) : null;
      if (el && !scrolled) {
        scrolled = true;
        // elementos altos aparecem a partir do topo; os demais, centralizados
        const tall = el.getBoundingClientRect().height > vh * 0.55;
        el.scrollIntoView({ block: tall ? "start" : "center", behavior: "smooth" });
      }
      const r = el?.getBoundingClientRect();
      const rect = r ? { top: r.top, left: r.left, width: r.width, height: r.height } : { top: 0, left: 0, width: 0, height: 0 };
      const next = [step.id, rect.top, rect.left, rect.width, rect.height, vw, vh].map((v) => (typeof v === "number" ? Math.round(v) : v)).join("|");
      if (next !== signature) {
        signature = next;
        setMeasure({ key: step.id, rect, vw, vh });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step.id, step.target]);

  // setas do teclado
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const current = measure?.key === step.id ? measure : null;
  const vw = current?.vw ?? window.innerWidth;
  const vh = current?.vh ?? window.innerHeight;
  const hasRect = Boolean(step.target && current && current.rect.width > 0);
  const pad = 8;
  const spot = hasRect && current
    ? {
        top: Math.max(6, current.rect.top - pad),
        left: Math.max(6, current.rect.left - pad),
        right: Math.min(vw - 6, current.rect.left + current.rect.width + pad),
        bottom: Math.min(vh - 6, current.rect.top + current.rect.height + pad),
      }
    : null;

  const mobile = vw < 640;
  let bubbleStyle: CSSProperties;
  if (mobile) {
    const lowerHalf = spot ? (spot.top + spot.bottom) / 2 > vh / 2 : false;
    bubbleStyle = lowerHalf
      ? { left: 12, right: 12, top: "max(12px, env(safe-area-inset-top))" }
      : { left: 12, right: 12, bottom: "max(12px, env(safe-area-inset-bottom))" };
  } else if (!spot) {
    bubbleStyle = { left: Math.max(12, (vw - BUBBLE_WIDTH) / 2), top: Math.max(12, vh / 2 - 130), width: BUBBLE_WIDTH };
  } else {
    const center = (spot.left + spot.right) / 2;
    const left = Math.min(Math.max(12, center - BUBBLE_WIDTH / 2), vw - BUBBLE_WIDTH - 12);
    if (vh - spot.bottom >= 240) bubbleStyle = { left, top: spot.bottom + 14, width: BUBBLE_WIDTH };
    else if (spot.top >= 240) bubbleStyle = { left, bottom: vh - spot.top + 14, width: BUBBLE_WIDTH };
    else {
      const sideLeft = vw - spot.right >= BUBBLE_WIDTH + 26 ? spot.right + 14 : Math.max(12, spot.left - BUBBLE_WIDTH - 14);
      bubbleStyle = { left: sideLeft, top: Math.min(Math.max(12, spot.top), vh - 300), width: BUBBLE_WIDTH };
    }
  }

  const body = typeof step.body === "function" ? step.body({ data, cuts }) : step.body;
  const last = stepIndex === steps.length - 1;

  return createPortal(
    <>
      {/* bloqueia cliques na página durante o tour */}
      <div className="fixed inset-0 z-[80]" aria-hidden />
      {spot ? (
        <div
          className="pointer-events-none fixed z-[81] rounded-2xl ring-2 ring-primary transition-all duration-300 ease-out"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.right - spot.left,
            height: spot.bottom - spot.top,
            boxShadow: "0 0 0 9999px rgba(8, 12, 20, 0.62)",
          }}
          aria-hidden
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-[81] bg-slate-950/60" aria-hidden />
      )}

      <div
        key={step.id}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="fixed z-[82] animate-pop-in rounded-2xl border bg-popover p-4 text-popover-foreground shadow-2xl"
        style={bubbleStyle}
      >
        <div className="flex gap-3">
          <Pet size={mobile ? 46 : 54} mood="talk" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
              Tutorial · {stepIndex + 1} de {steps.length}
            </p>
            <p id="tour-title" className="mt-0.5 font-semibold">
              {step.title}
            </p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">{body}</p>
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" onClick={skip} className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">
            Pular tutorial
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <Button variant="outline" size="sm" onClick={prev}>
                <ChevronLeft /> Voltar
              </Button>
            ) : null}
            <Button size="sm" onClick={next} autoFocus>
              {last ? "Concluir" : "Próximo"} <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
