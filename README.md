# 🐷 MoneySave

Organizador financeiro pessoal: cartões e assinaturas por banco, gastos do dia a dia, contas do mês,
**quanto sobra** no fim do mês (com alerta quando fica no vermelho) e **objetivos** com o valor exato
para guardar por mês, semana e dia.

Feito com **Next.js 16 + React 19 + Tailwind CSS v4**, dados no **Firebase** (login com Google + Cloud
Firestore) e hospedado na **Vercel**: **https://moneysave-eosin.vercel.app**

## Funcionalidades

- **Visão geral** — "Quanto sobra no mês" = receitas − (gastos no Pix/débito + contas gerais + cartões + assinaturas).
  Fica vermelho quando o saldo é negativo e mostra um diagnóstico com os maiores gastos e os cartões que mais pesam.
- **Lançamentos** — gastos diários (Pix, débito, dinheiro ou cartão com parcelas), contas gerais (fixas que repetem
  todo mês, com "paga/pendente") e receitas (salário fixo, extras). Filtros por tipo, banco e situação.
- **Cartões e contas** — cartões com a cor e o símbolo oficial do banco, limite usado (alerta acima de 80%),
  fatura aberta, próxima fatura, melhor dia de compra e faturas mês a mês com cada compra/parcela/assinatura.
- **Radar de assinaturas** — total por mês e por ano, agrupado por cartão ("No Nubank: R$ 72,70/mês"),
  próxima cobrança e o botão **Simular corte** que mostra na hora quanto passa a sobrar.
- **Objetivos** — quanto guardar por mês, semana e dia até a data-alvo, se cabe no orçamento, aportes e simulador
  "e se eu guardar R$ X por mês?".
- **Bancos brasileiros** — Nubank, Inter, PicPay, Sicoob, Itaú, Bradesco, Santander, C6, BB, Caixa, Mercado Pago e
  outros 30 com símbolo vetorial oficial, além de 623 instituições do Banco Central com logo.
- **Modo escuro**, layout para celular (barra inferior + botão "+"), instalável na tela inicial,
  **modo local** sem conta e **backup/restauração em JSON**.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com a config do app Web do Firebase
npm run dev                  # http://localhost:3000
```

Sem as variáveis do Firebase o app funciona só no **modo local** (dados no navegador).

Antes de publicar:

```bash
npm run typecheck
npm run build
```

## Firebase

Projeto: `moneysave-ed79d`.

1. **Authentication** › Método de login › **Google** ativado.
2. **Firestore** (edição Standard, banco `(default)`, região `southamerica-east1`) com as regras de
   [`firestore.rules`](firestore.rules): cada usuário só lê/grava `users/{uid}/...`.
   Para publicar mudanças nas regras pela linha de comando: `npx firebase-tools deploy --only firestore:rules`.
3. **Authentication › Configurações › Domínios autorizados**: inclui `moneysave-eosin.vercel.app` (adicione aqui
   qualquer domínio próprio que você ligar na Vercel, senão o login com Google é recusado nele).

Estrutura no Firestore:

```
users/{uid}/accounts/{id}        contas e saldos
users/{uid}/cards/{id}           cartões (limite, fechamento, vencimento)
users/{uid}/subscriptions/{id}   assinaturas (valor, ciclo, dia, cartão)
users/{uid}/transactions/{id}    receitas, gastos diários e contas gerais
users/{uid}/goals/{id}           objetivos
```

## Deploy na Vercel

O repositório está ligado à Vercel: cada `git push` na branch `main` publica uma nova versão.
As variáveis `NEXT_PUBLIC_FIREBASE_*` (veja [`.env.example`](.env.example)) ficam em
**Project › Settings › Environment Variables**.

## Créditos

- Símbolos dos bancos: [`@edusites/bancos-brasil`](https://github.com/eduardolecdt/bancos-brasil) (MIT).
- Logos das demais instituições: [`logos-bancos-br`](https://github.com/rzmt/logos-bancos-br) (dataset MIT; marcas
  pertencem às instituições e são usadas apenas para identificação).
- Ícones: [Lucide](https://lucide.dev) (ISC).
