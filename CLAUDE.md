# MoneySave — contrato do projeto

@AGENTS.md

App de finanças pessoais (pt-BR): cartões e assinaturas por banco, gastos diários, contas gerais,
"Quanto Sobra" do mês com alerta de negativo e calculadora de objetivos. Next.js 16 (App Router,
`src/`), React 19, Tailwind CSS v4, Radix UI, Recharts, Firebase (Auth Google + Firestore), Vercel.

## Comandos
- `npm run dev` — servidor local
- `npm run typecheck` e `npm run build` — IMPORTANTE: rodar os dois antes de dar qualquer tarefa por concluída
- `npm run lint`

## Regras
- Tailwind v4: sem `tailwind.config`; tokens em `src/app/globals.css` (`@theme inline`). Animações com `tw-animate-css`.
- React 19: sem `forwardRef`; `ref` é prop comum.
- Componentes de UI próprios em `src/components/ui` (Radix via pacote `radix-ui`).
- Tema claro/escuro: classe `.dark` no `<html>` (script em `src/lib/theme-script.ts`), hook `useTheme` em `src/lib/theme.ts`.
- PROIBIDO commitar `.env.local`. Chaves do Firebase vêm de `NEXT_PUBLIC_FIREBASE_*` (ver `.env.example`).
- Todo o app depende do login no navegador: páginas exportam `instant = false` (Cache Components).

## Dados (Firestore: `users/{uid}/{coleção}/{id}`)
`accounts`, `cards`, `subscriptions`, `transactions`, `goals` — tipos em `src/lib/types.ts`,
saneamento em `src/lib/backup.ts`, regras em `firestore.rules` (cada usuário só acessa os próprios dados).
Modo local (sem conta) guarda tudo no `localStorage` (`src/lib/local-store.ts`).

## Regras de negócio (src/lib/finance.ts, cards.ts, goals.ts)
- Assinaturas: equivalente mensal = valor ÷ meses do ciclo (anual ÷ 12).
- Quanto Sobra = Receitas − (Gastos no Pix/débito/dinheiro + Contas gerais fora do cartão + Compras/parcelas no cartão do mês + Assinaturas ativas).
- Parcelas: cada parcela conta no mês correspondente; centavos que sobram vão nas primeiras.
- Fatura: compra antes do dia de fechamento entra na fatura que fecha no mês; no dia do fechamento ou depois, na seguinte. Mês da fatura = mês do vencimento.
- Objetivos: falta = max(0, meta − guardado); por mês = falta ÷ max(1, meses completos até a data); por semana = falta ÷ max(1, ⌊dias/7⌋); por dia = falta ÷ max(1, dias).
- "Simular corte" de assinaturas é só em memória (não grava).

## Bancos
`src/lib/banks.ts`: 41 bancos com símbolo vetorial oficial (`@edusites/bancos-brasil`) e cores de marca,
mais 623 instituições do Banco Central com logo via CDN (`logos-bancos-br`, lista em `src/data/instituicoes.json`,
gerada por `scripts/gerar-instituicoes.mjs`).
