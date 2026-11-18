"use client";

import { useState } from "react";
import { ChartPie, FlaskConical, Lock, Repeat, Smartphone, Sparkles, Target, TrendingUp } from "lucide-react";
import { useFinance } from "@/context/finance-context";
import { Button } from "@/components/ui/button";
import { BankLogo } from "@/components/bank/bank-logo";
import { Pet } from "@/components/pet/pet";
import { Logo } from "./brand";

const FEATURES = [
  { icon: TrendingUp, title: "Quanto sobra no mês", text: "Com alerta quando ficar no vermelho." },
  { icon: Repeat, title: "Radar de assinaturas", text: "Simule cancelamentos na hora." },
  { icon: Target, title: "Objetivos com valor certo", text: "Quanto guardar por mês, semana e dia." },
  { icon: ChartPie, title: "Tudo por banco", text: "Logos oficiais de 600+ instituições." },
];

const BANKS = ["nubank", "inter", "picpay", "sicoob", "itau", "bradesco", "santander", "c6", "bancodobrasil", "caixa", "mercadopago"];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginScreen() {
  const { signIn, cloudAvailable, devLoginAvailable, devLogin } = useFinance();
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await signIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid h-dvh overflow-hidden bg-app-glow lg:grid-cols-[1.1fr_1fr]">
      {/* Apresentação (computador) */}
      <section className="relative hidden min-h-0 overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white lg:flex lg:flex-col lg:justify-between lg:gap-6 lg:p-10 xl:p-12">
        <div className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-black/10" />
        <Logo className="relative [&_span.text-primary]:text-emerald-100" />
        <div className="relative max-w-xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
            <Sparkles className="size-4" /> Organize sua vida financeira
          </p>
          <h1 className="text-[2.6rem] leading-[1.08] font-bold tracking-tight xl:text-5xl [@media(max-height:720px)]:text-4xl">
            Cartões, assinaturas e metas em um só lugar.
          </h1>
          <p className="mt-3 text-base text-emerald-50/90 xl:text-lg [@media(max-height:720px)]:text-sm">
            Lance seus gastos do dia, veja quanto sobra no fim do mês e descubra quanto guardar para cada objetivo.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:gap-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-2.5 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <Icon className="mt-0.5 size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="text-xs text-emerald-50/85">{feature.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative flex flex-wrap gap-2">
          {BANKS.map((slug) => (
            <BankLogo key={slug} slug={slug} size={34} className="shadow-md shadow-black/20" />
          ))}
        </div>
      </section>

      {/* Entrada */}
      <section className="flex min-h-0 flex-col justify-center overflow-y-auto px-6 py-6 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-6 lg:hidden" size={38} />
          <div className="flex items-end gap-3">
            <Pet size={72} mood="talk" />
            <div className="relative mb-3 rounded-2xl rounded-bl-sm border bg-popover px-3.5 py-2.5 text-sm shadow-sm">
              Oi! Eu sou o <strong>Poupinho</strong>. Vamos organizar seu dinheiro? 🐷
            </div>
          </div>
          <h2 className="mt-5 text-3xl font-bold tracking-tight">Bem-vindo ao MoneySave</h2>
          <p className="mt-2 text-muted-foreground">
            Entre com sua conta Google para começar. Seus dados ficam guardados com segurança e sincronizam no celular e no computador.
          </p>

          <div className="mt-6 grid gap-2">
            {cloudAvailable ? (
              <Button size="lg" variant="outline" className="h-13 text-base shadow-sm" onClick={handleGoogle} disabled={busy}>
                <GoogleIcon />
                {busy ? "Abrindo o Google…" : "Entrar com Google"}
              </Button>
            ) : (
              <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                O login com Google aparece aqui quando as chaves do Firebase estiverem configuradas.
              </p>
            )}
            {devLoginAvailable ? (
              <Button variant="ghost" size="sm" onClick={devLogin} className="text-muted-foreground">
                <FlaskConical /> Entrar como teste (só no ambiente de desenvolvimento)
              </Button>
            ) : null}
          </div>

          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
              Só você acessa seus dados (regras de segurança do Firebase).
            </li>
            <li className="flex gap-2">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" />
              Funciona no celular: dá para adicionar à tela inicial.
            </li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-1.5 lg:hidden">
            {BANKS.slice(0, 8).map((slug) => (
              <BankLogo key={slug} slug={slug} size={28} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
