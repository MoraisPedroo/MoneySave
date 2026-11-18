"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  CreditCard,
  HardDrive,
  LayoutDashboard,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Plus,
  ReceiptText,
  Repeat,
  Settings,
  Sun,
  Target,
  Upload,
} from "lucide-react";
import { useFinance } from "@/context/finance-context";
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
  "/ajustes": { title: "Ajustes", subtitle: "Conta, sincronização, backup e aparência." },
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
  const meta = PAGE_META[pathname] ?? PAGE_META["/"];

  return (
    <div className="min-h-dvh bg-app-glow">
      <Sidebar pathname={pathname} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
            <Link href="/" className="lg:hidden" aria-label="MoneySave — início">
              <LogoMark size={34} />
            </Link>
            <div className="hidden min-w-0 flex-1 lg:block">
              <h1 className="truncate text-xl font-semibold tracking-tight">{meta.title}</h1>
              <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>
            <div className="flex min-w-0 flex-1 justify-center lg:flex-none">
              <MonthSwitcher />
            </div>
            <Button className="hidden sm:inline-flex" onClick={() => open({ type: "transaction" })}>
              <Plus /> Novo lançamento
            </Button>
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pt-4 pb-32 sm:px-6 sm:pt-6 lg:pb-12">
          <div className="mb-4 lg:hidden">
            <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
            <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
          </div>
          <LocalImportBanner />
          {children}
        </main>
      </div>

      <BottomNav pathname={pathname} />

      <Button
        size="icon"
        className="fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-2xl shadow-xl shadow-primary/30 sm:hidden"
        onClick={() => open({ type: "transaction" })}
        aria-label="Novo lançamento"
      >
        <Plus className="size-6" />
      </Button>

      <DialogsHost />
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const { mode, user, signIn, cloudAvailable } = useFinance();
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
        <div className="rounded-2xl border bg-card p-3">
          {mode === "cloud" ? (
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
                <Cloud className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold">Sincronizado na nuvem</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
                  <HardDrive className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">Modo local</p>
                  <p className="text-xs text-muted-foreground">Dados só neste navegador</p>
                </div>
              </div>
              {cloudAvailable ? (
                <Button size="sm" variant="outline" onClick={() => void signIn()}>
                  <LogIn /> Entrar com Google
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur-xl lg:hidden"
      aria-label="Navegação"
    >
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
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors",
                active && "text-primary",
              )}
            >
              <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-accent")}>
                <Icon className="size-5" />
              </span>
              {item.short}
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
    <div className="flex items-center gap-1 rounded-xl border bg-card p-1 shadow-xs">
      <Button variant="ghost" size="icon-sm" onClick={() => setMonth(addMonthsKey(month, -1))} aria-label="Mês anterior">
        <ChevronLeft />
      </Button>
      <button
        type="button"
        onClick={() => setMonth(currentMonthKey())}
        className="min-w-0 px-1 text-center text-sm font-semibold whitespace-nowrap"
        title="Voltar para o mês atual"
      >
        <span className="sm:hidden">
          {monthName(month).slice(0, 3)}/{month.slice(2, 4)}
        </span>
        <span className="hidden sm:inline">{monthLabel(month)}</span>
      </button>
      <Button variant="ghost" size="icon-sm" onClick={() => setMonth(addMonthsKey(month, 1))} aria-label="Próximo mês">
        <ChevronRight />
      </Button>
      {!isCurrent ? (
        <Button variant="soft" size="sm" className="h-7 px-2" onClick={() => setMonth(currentMonthKey())}>
          Hoje
        </Button>
      ) : null}
    </div>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Automático", icon: Monitor },
];

function UserMenu() {
  const { mode, user, signIn, signOutUser, exitLocal, cloudAvailable } = useFinance();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card text-sm font-semibold shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          aria-label="Menu da conta"
        >
          {mode === "cloud" && user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
          ) : mode === "cloud" && user ? (
            initials(user.name)
          ) : (
            <HardDrive className="size-4 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          {mode === "cloud" && user ? (
            <span className="grid">
              <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
              <span className="truncate">{user.email}</span>
            </span>
          ) : (
            "Modo local — dados neste navegador"
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/ajustes">
            <Settings /> Ajustes e backup
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <ThemeIcon className="size-3.5" /> Tema
        </DropdownMenuLabel>
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
        {mode === "cloud" ? (
          <DropdownMenuItem destructive onSelect={() => void signOutUser()}>
            <LogOut /> Sair da conta
          </DropdownMenuItem>
        ) : (
          <>
            {cloudAvailable ? (
              <DropdownMenuItem onSelect={() => void signIn()}>
                <LogIn /> Entrar com Google
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => exitLocal()}>
              <LogOut /> Sair do modo local
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LocalImportBanner() {
  const { mode, localDataAvailable, importLocalToCloud } = useFinance();
  const [dismissed, setDismissed] = useState(false);
  if (mode !== "cloud" || !localDataAvailable || dismissed) return null;
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-accent/60 p-4 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Upload className="size-5" />
      </span>
      <div className="flex-1">
        <p className="font-semibold">Você tem dados do modo local neste navegador</p>
        <p className="text-sm text-muted-foreground">Envie para a sua conta e acesse no celular e no computador.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setDismissed(true)}>
          Agora não
        </Button>
        <Button onClick={() => void importLocalToCloud()}>Enviar para a nuvem</Button>
      </div>
    </div>
  );
}
