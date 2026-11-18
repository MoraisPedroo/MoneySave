import { monthlyEquivalent } from "@/lib/finance";
import type { FinanceData } from "@/lib/types";

export interface TourApi {
  data: FinanceData;
  cuts: ReadonlySet<string>;
  toggleCut: (id: string) => void;
  clearCuts: () => void;
}

export interface TourContext {
  data: FinanceData;
  cuts: ReadonlySet<string>;
}

export interface TourStep {
  id: string;
  /** página onde o passo acontece */
  route: string;
  /** valor do atributo data-tour do elemento destacado (sem alvo = balão no centro) */
  target?: string;
  title: string;
  body: string | ((ctx: TourContext) => string);
  onEnter?: (api: TourApi, direction: "next" | "prev") => void;
  onLeave?: (api: TourApi, direction: "next" | "prev") => void;
}

/** Liga o "Simular corte" da assinatura mais cara (para mostrar a economia). */
function ensureCut(api: TourApi) {
  if (api.cuts.size > 0) return;
  const top = api.data.subscriptions.filter((s) => s.active).sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a))[0];
  if (top) api.toggleCut(top.id);
}

function cutName(ctx: TourContext) {
  return ctx.data.subscriptions.find((s) => ctx.cuts.has(s.id))?.name ?? "assinatura mais cara";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "intro",
    route: "/",
    title: "Oi! Eu sou o Poupinho 🐷",
    body: "Vou te mostrar o MoneySave em 2 minutinhos. Preenchi tudo com dados de exemplo (Nubank, Inter, PicPay e Sicoob) só para você ver funcionando — nada disso vai para a sua conta.",
  },
  {
    id: "hero",
    route: "/",
    target: "hero",
    title: "Quanto sobra no mês",
    body: "Receitas menos gastos do dia, contas, cartões e assinaturas. Se o mês ficar negativo, este painel fica vermelho e mostra o que está pesando.",
  },
  {
    id: "month",
    route: "/",
    target: "month",
    title: "Navegue pelos meses",
    body: "Use as setas para ver meses anteriores ou planejar os próximos. Toque no nome do mês para voltar para hoje.",
  },
  {
    id: "goals-fit",
    route: "/",
    target: "goals-fit",
    title: "Suas metas cabem?",
    body: "Comparo quanto você precisa guardar por mês para as metas com quanto sobra — e aviso se não couber.",
  },
  {
    id: "new-transaction",
    route: "/",
    target: "new-transaction",
    title: "Lançar é rápido",
    body: "Por aqui você lança gastos do dia (Pix, débito, dinheiro ou cartão parcelado), contas do mês e receitas como o salário.",
  },
  {
    id: "tx-list",
    route: "/lancamentos",
    target: "tx-list",
    title: "Seus lançamentos",
    body: "Tudo do mês, dia a dia, com a logo do banco. Toque no círculo para marcar uma conta como paga; contas fixas se repetem sozinhas.",
  },
  {
    id: "card-item",
    route: "/cartoes",
    target: "card-item",
    title: "Cartões com a cara do seu banco",
    body: "Cor e logo oficiais, limite usado (aviso acima de 80%), próxima fatura e o melhor dia de compra. Toque no cartão para ver as faturas mês a mês.",
  },
  {
    id: "add-card",
    route: "/cartoes",
    target: "add-card",
    title: "Adicionar cartão",
    body: "Escolha o banco, o limite e os dias de fechamento e vencimento — eu calculo em qual fatura cada compra cai, inclusive as parcelas.",
  },
  {
    id: "accounts",
    route: "/cartoes",
    target: "accounts",
    title: "Contas e saldos",
    body: "Cadastre também suas contas (corrente, poupança, carteira digital) para saber de onde saiu cada Pix e ver o saldo total.",
  },
  {
    id: "sub-list",
    route: "/assinaturas",
    target: "sub-list",
    title: "Radar de assinaturas",
    body: (ctx) =>
      `Todas as assinaturas e em qual cartão são cobradas. Liguei o “Simular corte” da ${cutName(ctx)} para você ver o que acontece…`,
    onEnter: (api) => ensureCut(api),
    onLeave: (api, direction) => {
      if (direction === "prev") api.clearCuts();
    },
  },
  {
    id: "cut-banner",
    route: "/assinaturas",
    target: "cut-banner",
    title: "Economia na hora",
    body: "O app mostra quanto você economiza por mês e quanto passa a sobrar. Gostou? É só “Cancelar de verdade” (e cancelar no app do serviço).",
    onEnter: (api) => ensureCut(api),
    onLeave: (api, direction) => {
      if (direction === "next") api.clearCuts();
    },
  },
  {
    id: "goal-card",
    route: "/objetivos",
    target: "goal-card",
    title: "Objetivos com valor certo",
    body: "Diga quanto quer juntar e até quando: eu calculo quanto guardar por mês, semana e dia — e se cabe no seu orçamento. O “Simular” mostra em quanto tempo você chega lá.",
  },
  {
    id: "add-goal",
    route: "/objetivos",
    target: "add-goal",
    title: "Crie seus objetivos",
    body: "Reserva de emergência, viagem, celular novo… Depois use “Guardar” sempre que juntar um dinheirinho.",
  },
  {
    id: "settings",
    route: "/ajustes",
    target: "settings-tutorial",
    title: "Ajustes",
    body: "Backup dos dados, aparência e — se quiser rever tudo isso — o tutorial fica aqui.",
  },
  {
    id: "theme",
    route: "/ajustes",
    target: "theme-toggle",
    title: "Claro ou escuro?",
    body: "Um toque aqui em cima troca entre o modo claro e o escuro.",
  },
];
