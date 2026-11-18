import {
  Baby,
  BadgePercent,
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  Clapperboard,
  Cloud,
  Coins,
  Dumbbell,
  Ellipsis,
  FileText,
  Flame,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Music,
  Newspaper,
  PawPrint,
  Plane,
  Receipt,
  RotateCcw,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Tv,
  Utensils,
  Wifi,
  Wrench,
  Zap,
  Droplet,
  Bus,
  type LucideIcon,
} from "lucide-react";
import type { TransactionType } from "./types";

export interface CategoryDef {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: "alimentacao", label: "Alimentação", icon: Utensils, color: "#f97316" },
  { id: "mercado", label: "Mercado", icon: ShoppingCart, color: "#16a34a" },
  { id: "transporte", label: "Transporte", icon: Bus, color: "#0ea5e9" },
  { id: "carro", label: "Carro e combustível", icon: Car, color: "#64748b" },
  { id: "compras", label: "Compras", icon: ShoppingBag, color: "#a855f7" },
  { id: "lazer", label: "Lazer", icon: Clapperboard, color: "#ec4899" },
  { id: "saude", label: "Saúde e farmácia", icon: HeartPulse, color: "#ef4444" },
  { id: "educacao", label: "Educação", icon: GraduationCap, color: "#6366f1" },
  { id: "beleza", label: "Beleza e cuidados", icon: Sparkles, color: "#d946ef" },
  { id: "casa", label: "Casa", icon: House, color: "#ca8a04" },
  { id: "pets", label: "Pets", icon: PawPrint, color: "#b45309" },
  { id: "filhos", label: "Filhos", icon: Baby, color: "#f472b6" },
  { id: "viagem", label: "Viagem", icon: Plane, color: "#06b6d4" },
  { id: "presentes", label: "Presentes", icon: Gift, color: "#e11d48" },
  { id: "servicos", label: "Serviços", icon: Wrench, color: "#78716c" },
  { id: "outros", label: "Outros", icon: Ellipsis, color: "#94a3b8" },
];

export const BILL_CATEGORIES: CategoryDef[] = [
  { id: "moradia", label: "Aluguel e condomínio", icon: House, color: "#ca8a04" },
  { id: "energia", label: "Energia", icon: Zap, color: "#eab308" },
  { id: "agua", label: "Água", icon: Droplet, color: "#0ea5e9" },
  { id: "internet", label: "Internet", icon: Wifi, color: "#6366f1" },
  { id: "celular", label: "Celular e telefone", icon: Smartphone, color: "#8b5cf6" },
  { id: "gas", label: "Gás", icon: Flame, color: "#f97316" },
  { id: "educacao", label: "Escola e faculdade", icon: GraduationCap, color: "#4f46e5" },
  { id: "saude", label: "Plano de saúde", icon: HeartPulse, color: "#ef4444" },
  { id: "seguro", label: "Seguros", icon: Shield, color: "#14b8a6" },
  { id: "impostos", label: "Impostos e taxas", icon: Landmark, color: "#64748b" },
  { id: "emprestimo", label: "Empréstimo e financiamento", icon: HandCoins, color: "#dc2626" },
  { id: "fatura", label: "Fatura de cartão", icon: Receipt, color: "#7c3aed" },
  { id: "outros", label: "Outras contas", icon: FileText, color: "#94a3b8" },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { id: "salario", label: "Salário", icon: Briefcase, color: "#16a34a" },
  { id: "extra", label: "Freelance e extras", icon: Laptop, color: "#0d9488" },
  { id: "investimentos", label: "Rendimentos", icon: TrendingUp, color: "#0284c7" },
  { id: "vendas", label: "Vendas", icon: Store, color: "#7c3aed" },
  { id: "reembolso", label: "Reembolso", icon: RotateCcw, color: "#ea580c" },
  { id: "beneficios", label: "Benefícios", icon: BadgePercent, color: "#db2777" },
  { id: "presente", label: "Presente", icon: Gift, color: "#e11d48" },
  { id: "outros", label: "Outras receitas", icon: Coins, color: "#22c55e" },
];

export const SUBSCRIPTION_CATEGORIES: CategoryDef[] = [
  { id: "streaming", label: "Streaming de vídeo", icon: Tv, color: "#ef4444" },
  { id: "musica", label: "Música e áudio", icon: Music, color: "#22c55e" },
  { id: "software", label: "Apps e software", icon: Laptop, color: "#3b82f6" },
  { id: "nuvem", label: "Nuvem e armazenamento", icon: Cloud, color: "#0ea5e9" },
  { id: "jogos", label: "Jogos", icon: Gamepad2, color: "#8b5cf6" },
  { id: "educacao", label: "Cursos e idiomas", icon: BookOpen, color: "#f59e0b" },
  { id: "noticias", label: "Notícias e leitura", icon: Newspaper, color: "#64748b" },
  { id: "saude", label: "Academia e saúde", icon: Dumbbell, color: "#f43f5e" },
  { id: "clubes", label: "Clubes e delivery", icon: Utensils, color: "#f97316" },
  { id: "banco", label: "Tarifas bancárias", icon: Banknote, color: "#14b8a6" },
  { id: "outros", label: "Outras assinaturas", icon: Ellipsis, color: "#94a3b8" },
];

export function categoriesFor(type: TransactionType): CategoryDef[] {
  if (type === "receita") return INCOME_CATEGORIES;
  if (type === "conta_geral") return BILL_CATEGORIES;
  return EXPENSE_CATEGORIES;
}

const fallback: CategoryDef = { id: "outros", label: "Outros", icon: Ellipsis, color: "#94a3b8" };

export function getCategory(type: TransactionType, id: string): CategoryDef {
  return categoriesFor(type).find((c) => c.id === id) ?? fallback;
}

export function getSubscriptionCategory(id: string): CategoryDef {
  return SUBSCRIPTION_CATEGORIES.find((c) => c.id === id) ?? fallback;
}

export const TYPE_LABEL: Record<TransactionType, string> = {
  receita: "Receita",
  despesa_diaria: "Gasto diário",
  conta_geral: "Conta geral",
};
