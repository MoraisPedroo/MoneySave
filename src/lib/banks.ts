import instituicoes from "@/data/instituicoes.json";
import { normalizeText } from "./utils";

/**
 * Catálogo de bancos.
 * - "curated": logos vetoriais do pacote @edusites/bancos-brasil (MIT) com cores oficiais.
 * - "ispb:XXXXXXXX": demais instituições do Banco Central, com logo pela CDN do
 *   dataset logos-bancos-br (https://github.com/rzmt/logos-bancos-br).
 */

export type BankKind = "curated" | "ispb" | "cash" | "other";

export interface BankInfo {
  slug: string;
  name: string;
  compe?: string | null;
  ispb?: string | null;
  /** cor de fundo oficial do ícone */
  bg: string;
  /** cor do símbolo sobre o fundo */
  fg: string;
  /** degradê usado no cartão de crédito visual */
  gradient: [string, string];
  kind: BankKind;
  logoUrl?: string | null;
}

interface RawInstitution {
  i: string;
  c: string | null;
  n: string;
  l: string;
}

const CDN_BASE = "https://cdn.jsdelivr.net/npm/logos-bancos-br@0/logos";

export function logoUrlFromIspb(ispb: string, format: "svg" | "png" = "svg") {
  return `${CDN_BASE}/${format}/${ispb}.${format}`;
}

function logoUrlFrom(code: string) {
  const [format, ispb] = code.split(":");
  return logoUrlFromIspb(ispb, format === "s" ? "svg" : "png");
}

type CuratedSeed = [slug: string, name: string, compe: string | null, ispb: string | null, fg: string, bg: string, gradient: [string, string]];

const CURATED_SEED: CuratedSeed[] = [
  ["nubank", "Nubank", "260", "18236120", "#FFFFFF", "#820AD1", ["#8A05BE", "#4A0A8C"]],
  ["inter", "Banco Inter", "077", "00416968", "#FFFFFF", "#FF7A00", ["#FF8A1F", "#E25500"]],
  ["picpay", "PicPay", "380", "22896431", "#FFFFFF", "#21C25E", ["#21C25E", "#0B8A3D"]],
  ["sicoob", "Sicoob", "756", "02038232", "#B8D335", "#003B43", ["#00515C", "#002A30"]],
  ["itau", "Itaú", "341", "60701190", "#FFFFFF", "#EC7000", ["#F27A0A", "#C24F00"]],
  ["bradesco", "Bradesco", "237", "60746948", "#FFFFFF", "#CC092F", ["#D90F37", "#8E0620"]],
  ["santander", "Santander", "033", "90400888", "#FFFFFF", "#EC0000", ["#F21B1B", "#A30000"]],
  ["c6", "C6 Bank", "336", "31872495", "#FFFFFF", "#121212", ["#2E2E2E", "#050505"]],
  ["bancodobrasil", "Banco do Brasil", "001", "00000000", "#FFDD00", "#003D7A", ["#0A4C93", "#00244A"]],
  ["caixa", "Caixa", "104", "00360305", "#FFFFFF", "#0066A1", ["#0A74B5", "#00406A"]],
  ["mercadopago", "Mercado Pago", "323", "10573521", "#0A0080", "#00BCFF", ["#22C5FF", "#0083C9"]],
  ["pagbank", "PagBank", "290", "08561701", "#000000", "#42A936", ["#4DB840", "#23711A"]],
  ["sicredi", "Sicredi", "748", "01181521", "#3DAE2B", "#FFFFFF", ["#3DAE2B", "#1F6E15"]],
  ["neon", "Neon", "536", "20855875", "#01C4E0", "#161C3E", ["#1B2350", "#0B0F24"]],
  ["cora", "Cora", "403", "37880206", "#FFFFFF", "#FE3E6D", ["#FE4F7A", "#C2184A"]],
  ["btg", "BTG Pactual", "208", "30306294", "#FFFFFF", "#001E62", ["#0A2C80", "#000F33"]],
  ["xp", "XP Investimentos", "102", "02332886", "#000000", "#FFFFFF", ["#2A2A2A", "#000000"]],
  ["digio", "Digio", "335", "27098060", "#FFFFFF", "#00275C", ["#003A86", "#00183A"]],
  ["original", "Banco Original", "212", "92894922", "#FFFFFF", "#00A857", ["#10B865", "#00733B"]],
  ["pan", "Banco Pan", "623", "59285411", "#414141", "#FFFFFF", ["#00AFEF", "#0067A6"]],
  ["bmg", "Banco BMG", "318", "61186680", "#FFFFFF", "#F26321", ["#F57334", "#C24A12"]],
  ["bv", "Banco BV", "413", "01858774", "#223AD2", "#FFFFFF", ["#2C46E0", "#14248A"]],
  ["agibank", "Agibank", "121", "10664513", "#FFFFFF", "#0133B0", ["#0A40C8", "#00217A"]],
  ["next", "Next", "237", null, "#000000", "#00FF5F", ["#22F570", "#00B843"]],
  ["safra", "Safra", "422", "58160789", "#C3AC6C", "#151D43", ["#212B5E", "#0D1230"]],
  ["mercantil", "Mercantil", "389", "17184037", "#FFFFFF", "#1526FF", ["#2535FF", "#0B17B0"]],
  ["bs2", "Banco BS2", "218", "71027866", "#FFFFFF", "#0021AF", ["#0A2FC8", "#001370"]],
  ["infinitepay", "InfinitePay", "542", "18189547", "#7DDB13", "#171527", ["#25223D", "#0D0B18"]],
  ["stone", "Stone", "197", "16501555", "#00A868", "#FFFFFF", ["#00B370", "#00704A"]],
  ["ton", "Ton", null, null, "#FFFFFF", "#0DEA4A", ["#1FF25A", "#08B03A"]],
  ["efibank", "Efí Bank", "364", "09089356", "#F37025", "#000000", ["#2A2A2A", "#000000"]],
  ["asaas", "Asaas", "461", "19540550", "#FFFFFF", "#0036E1", ["#0A44F0", "#0024A0"]],
  ["iugu", "iugu", "401", "15111975", "#000000", "#FFFFFF", ["#2B2B2B", "#000000"]],
  ["nomad", "Nomad", null, null, "#000000", "#FFCE04", ["#FFD52E", "#E0B000"]],
  ["wise", "Wise", null, "40571694", "#163300", "#9FE870", ["#A8EC7C", "#5CB82E"]],
  ["revolut", "Revolut", "620", "51342763", "#FFFFFF", "#000000", ["#2B2E33", "#000000"]],
  ["avenue", "Avenue", null, null, "#FFFFFF", "#002820", ["#00473A", "#001A14"]],
  ["rico", "Rico", null, null, "#FF5200", "#010042", ["#16146E", "#010030"]],
  ["ngcash", "NG.CASH", null, null, "#FFFFFF", "#000000", ["#262626", "#000000"]],
  ["paypal", "PayPal", null, null, "#222D65", "#FFFFFF", ["#0A3A9A", "#001C64"]],
  ["stripe", "Stripe", null, null, "#FFFFFF", "#635BFF", ["#6E67FF", "#3A32D6"]],
];

export const CURATED_BANKS: BankInfo[] = CURATED_SEED.map(([slug, name, compe, ispb, fg, bg, gradient]) => ({
  slug,
  name,
  compe,
  ispb,
  fg,
  bg,
  gradient,
  kind: "curated" as const,
}));

/** Bancos em destaque nas listas de escolha (os quatro primeiros são os principais do usuário). */
export const POPULAR_SLUGS = [
  "nubank",
  "inter",
  "picpay",
  "sicoob",
  "itau",
  "bradesco",
  "santander",
  "c6",
  "bancodobrasil",
  "caixa",
  "mercadopago",
  "pagbank",
];

export const CASH_BANK: BankInfo = {
  slug: "dinheiro",
  name: "Dinheiro / carteira",
  bg: "#16A34A",
  fg: "#FFFFFF",
  gradient: ["#22C55E", "#15803D"],
  kind: "cash",
};

export const OTHER_BANK: BankInfo = {
  slug: "outro",
  name: "Outro banco",
  bg: "#64748B",
  fg: "#FFFFFF",
  gradient: ["#64748B", "#334155"],
  kind: "other",
};

const INSTITUTIONS = instituicoes as RawInstitution[];
const curatedBySlug = new Map(CURATED_BANKS.map((bank) => [bank.slug, bank]));
const curatedIspbs = new Set(CURATED_BANKS.map((bank) => bank.ispb).filter(Boolean));
const institutionByIspb = new Map(INSTITUTIONS.map((item) => [item.i, item]));

const NEUTRAL_GRADIENTS: [string, string][] = [
  ["#334155", "#0F172A"],
  ["#1E3A8A", "#0B1B4D"],
  ["#065F46", "#022C22"],
  ["#7C2D12", "#431407"],
  ["#4C1D95", "#2E1065"],
  ["#831843", "#500724"],
];

function gradientFor(seed: string): [string, string] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return NEUTRAL_GRADIENTS[hash % NEUTRAL_GRADIENTS.length];
}

function fromInstitution(item: RawInstitution): BankInfo {
  return {
    slug: `ispb:${item.i}`,
    name: item.n,
    compe: item.c,
    ispb: item.i,
    bg: "#FFFFFF",
    fg: "#0F172A",
    gradient: gradientFor(item.i),
    kind: "ispb",
    logoUrl: logoUrlFrom(item.l),
  };
}

export function getBank(slug?: string | null): BankInfo {
  if (!slug) return OTHER_BANK;
  const curated = curatedBySlug.get(slug);
  if (curated) return curated;
  if (slug === CASH_BANK.slug) return CASH_BANK;
  if (slug.startsWith("ispb:")) {
    const item = institutionByIspb.get(slug.slice(5));
    if (item) return fromInstitution(item);
  }
  return OTHER_BANK;
}

export function bankName(slug?: string | null): string {
  return getBank(slug).name;
}

/** Cor principal do banco para gráficos (evita branco em fundo claro). */
export function bankChartColor(slug?: string | null): string {
  const bank = getBank(slug);
  const base = bank.bg.toUpperCase();
  if (base === "#FFFFFF" || base === "#FFF") return bank.gradient[0];
  return bank.bg;
}

export function popularBanks(): BankInfo[] {
  return POPULAR_SLUGS.map((slug) => curatedBySlug.get(slug)).filter(Boolean) as BankInfo[];
}

/** Busca por nome ou código COMPE em bancos destacados + instituições do Banco Central. */
export function searchBanks(query: string, limit = 40): BankInfo[] {
  const q = normalizeText(query);
  if (!q) {
    const rest = CURATED_BANKS.filter((bank) => !POPULAR_SLUGS.includes(bank.slug));
    return [...popularBanks(), ...rest];
  }
  const results: BankInfo[] = [];
  for (const bank of CURATED_BANKS) {
    if (normalizeText(bank.name).includes(q) || bank.slug.includes(q) || bank.compe === q.padStart(3, "0")) {
      results.push(bank);
    }
  }
  for (const item of INSTITUTIONS) {
    if (results.length >= limit) break;
    if (curatedIspbs.has(item.i)) continue;
    if (normalizeText(item.n).includes(q) || (item.c && item.c === q.padStart(3, "0"))) {
      results.push(fromInstitution(item));
    }
  }
  return results.slice(0, limit);
}

export const INSTITUTION_COUNT = INSTITUTIONS.length;
