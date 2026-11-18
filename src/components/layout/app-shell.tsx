"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Plus,
  ReceiptText,
  Repeat,
  Settings,
  Sun,
  Target,
} from "lucide-react";
import { useFinance, type FinanceUser } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { addMonthsKey, currentMonthKey, monthLabel, monthName } from "@/lib/format";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/misc";
import { DialogsHost } from "@/components/dialogs/dialogs-host";
import { PetGuide } from "@/components/pet/pet-guide";
import { TutorialLayer } from "@/components/tutorial/tutorial-layer";
import { Logo, LogoMark } from "./brand";
import { LoginScreen } from "./login-screen";

const NAV = [
  { href: "/", label: "Visão geral", short: "Início", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", short: "Lançar", icon: ReceiptText },
  { href: "/cartoes", label: "Cartões e contas", short: "Cartões", icon: CreditCard },
  { href: "/assinaturas", label: "Assinaturas", short: "Assinaturas", icon: Repeat },
  { href: "/objetivos", label: "Objetivos", short: "Metas", icon: Target },
  { href: "/ajustes", label: "Ajustes", short: "Ajustes", icon: Settings },
] as const;

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Visão geral", subtitle: "Seu mês em um olhar: quanto entra, quanto sai e quanto sobra." },
  "/lancamentos": { title: "Lançamentos", subtitle: "Receitas, gastos do dia a dia e contas gerais do mês." },
  "/cartoes": { title: "Cartões e contas", subtitle: "Limites, faturas, vencimentos e saldos de cada banco." },
  "/assinaturas": { title: "Radar de assinaturas", subtitle: "Tudo o que é cobrado todo mês nos seus cartões." },
  "/objetivos": { title: "Objetivos", subtitle: "Quanto guardar por mês, semana e dia para chegar lá." },
  "/ajustes": { title: "Ajustes", subtitle: "Conta, tutorial, backup e aparência." },
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { mode } = useFinance();
  if (mode === "loading") return <Splash />;
  if (mode === "signed-out") return <LoginScreen />;
  return <Shell>{children}</Shell>;
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-app-glow">
      <LogoMark size={56} className="animate-pulse" />
      <p className="text-sm text-muted-foreground">Carregando suas finanças…</p>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { open } = useDialogs();
  const { sandbox } = useFinance();
  const meta = PAGE_META[pathname] ?? PAGE_META["/"];

  return (
    <div className="min-h-dvh bg-app-glow">
      <Sidebar pathname={pathname} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-1.5 px-3 min-[380px]:gap-2 min-[380px]:px-4 sm:gap-3 sm:px-6">
            <Link href="/" className="shrink-0 max-[339px]:hidden lg:hidden" aria-label="MoneySave — início">
              <LogoMark size={34} />
            </Link>
            <div className="hidden min-w-0 flex-1 lg:block">
              <h1 className="truncate text-xl font-semibold tracking-tight">{meta.title}</h1>
              <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>
            <div className="flex min-w-0 flex-1 justify-center lg:flex-none">
              <MonthSwitcher />
            </div>
            <Button className="hidden sm:inline-flex" onClick={() => open({ type: "transaction" })} data-tour="new-transaction">
              <Plus /> Novo lançamento
            </Button>
            <ThemeToggle />
            <UserMenu />
          </div>
          {sandbox ? (
            <div className="border-t border-primary/20 bg-accent px-4 py-1.5 text-center text-xs font-medium text-accent-foreground">
              Modo tutorial · você está vendo dados de exemplo
            </div>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-7xl min-w-0 px-3 pt-4 pb-36 min-[380px]:px-4 sm:px-6 sm:pt-6 lg:pb-12">
          <div className="mb-4 lg:hidden">
            <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
            <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
          </div>
          {children}
        </main>
      </div>

      <BottomNav pathname={pathname} />

      <Button
        size="icon"
        className="fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-2xl shadow-xl shadow-primary/30 sm:hidden"
        onClick={() => open({ type: "transaction" })}
        aria-label="Novo lançamento"
        data-tour="new-transaction"
      >
        <Plus className="size-6" />
      </Button>

      <DialogsHost />
      <PetGuide />
      <TutorialLayer />
    </div>
  );
}

function Avatar({ user, size = 40 }: { user: FinanceUser | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-semibold text-accent-foreground"
      style={{ width: size, height: size }}
    >
      {user?.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
      ) : (
        initials(user?.name ?? "?")
      )}
    </span>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const { user } = useFinance();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/" aria-label="MoneySave — início">
          <Logo />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Navegação principal">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {active ? <span className="absolute top-2 bottom-2 left-0 w-1 rounded-r-full bg-primary" /> : null}
              <Icon className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-2xl border bg-card p-3">
          <Avatar user={user} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Cloud className="size-3 text-success" /> Sincronizado
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur-xl lg:hidden" aria-label="Navegação">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.slice(0, 5).map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors min-[380px]:text-[11px]",
                active && "text-primary",
              )}
            >
              <span className={cn("flex h-7 w-11 max-w-full items-center justify-center rounded-full transition-colors", active && "bg-accent")}>
                <Icon className="size-5" />
              </span>
              <span className="max-w-full truncate px-0.5">{item.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MonthSwitcher() {
  const { month, setMonth } = useFinance();
  if (!month) return null;
  const isCurrent = month === currentMonthKey();
  return (
    <div className="flex min-w-0 items-center gap-0.5 rounded-xl border bg-card p-0.5 shadow-xs sm:gap-1 sm:p-1" data-tour="month">
      <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => setMonth(addMonthsKey(month, -1))} aria-label="Mês anterior">
        <ChevronLeft />
      </Button>
      <button
        type="button"
        onClick={() => setMonth(currentMonthKey())}
        className="min-w-0 truncate px-0.5 text-center text-[13px] font-semibold whitespace-nowrap sm:px-1 sm:text-sm"
        title="Voltar para o mês atual"
      >
        <span className="sm:hidden">
          {monthName(month).slice(0, 3)}/{month.slice(2, 4)}
        </span>
        <span className="hidden sm:inline">{monthLabel(month)}</span>
      </button>
      <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => setMonth(addMonthsKey(month, 1))} aria-label="Próximo mês">
        <ChevronRight />
      </Button>
      {!isCurrent ? (
        <Button variant="soft" size="sm" className="hidden h-7 px-2 sm:inline-flex" onClick={() => setMonth(currentMonthKey())}>
          Hoje
        </Button>
      ) : null}
    </div>
  );
}

/** Um clique troca entre claro e escuro. */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card text-foreground shadow-xs transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:size-10"
      aria-label={dark ? "Mudar para o modo claro" : "Mudar para o modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
      data-tour="theme-toggle"
    >
      <Sun className={cn("absolute size-[18px] text-amber-500 transition-all duration-300", dark ? "scale-100 rotate-0" : "scale-0 -rotate-90")} />
      <Moon className={cn("absolute size-[18px] text-indigo-500 transition-all duration-300", dark ? "scale-0 rotate-90" : "scale-100 rotate-0")} />
    </button>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

function UserMenu() {
  const { user, signOutUser } = useFinance();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:size-10"
          aria-label="Menu da conta"
        >
          <Avatar user={user} size={34} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          <span className="grid">
            <span className="truncate text-sm font-semibold text-foreground">{user?.name}</span>
            <span className="truncate">{user?.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/ajustes">
            <Settings /> Ajustes, tutorial e backup
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 px-1 pb-1">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] text-muted-foreground transition-colors hover:bg-muted",
                  theme === option.value && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => void signOutUser()}>
          <LogOut /> Sair da conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
