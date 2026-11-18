// Gera src/data/instituicoes.json a partir do dataset aberto "logos-bancos-br" (MIT),
// que reúne bancos, fintechs e cooperativas do Brasil (fontes: Banco Central e Open Finance).
//
// Uso:
//   npm pack logos-bancos-br && tar -xzf logos-bancos-br-*.tgz
//   node scripts/gerar-instituicoes.mjs ./package
//
// Só entram as instituições que têm logo publicado na CDN:
//   https://cdn.jsdelivr.net/npm/logos-bancos-br@0/logos/{svg|png}/{ISPB}.{svg|png}
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = process.argv[2];
if (!pkgDir) {
  console.error("Informe a pasta do pacote logos-bancos-br. Ex.: node scripts/gerar-instituicoes.mjs ./package");
  process.exit(1);
}

const read = (file) => JSON.parse(readFileSync(join(pkgDir, "data", file), "utf8"));
const cdn = read("cdn-index.min.json").institutions;
const banks = read("bancos.json").banks;
const pix = read("instituicoes-pix.json").institutions;

const displayNames = new Map();
for (const item of [...banks, ...pix]) {
  if (item.displayName) displayNames.set(item.ispb, item.displayName);
}

const SMALL = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o"]);
const KEEP_UPPER = /^(S\.?A\.?|S\/A|LTDA\.?|IP|CC|CCLA|CCPI|SCD|SCFI|SCM|DTVM|CCTVM|BCO|BRB|BNB|BNDES|XP|BTG|C6|PJ|EPP|ME|CNH|BS2|BV)$/i;

function prettify(name) {
  if (name !== name.toUpperCase()) return name.trim();
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (KEEP_UPPER.test(word)) return word.toUpperCase();
      if (index > 0 && SMALL.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .trim();
}

const list = [];
for (const [ispb, entry] of Object.entries(cdn)) {
  const [compe, name, flags, logoIspb] = entry;
  if (!flags) continue; // sem logo
  const format = flags & 2 ? "s" : "p"; // s = svg, p = png
  list.push({
    i: ispb,
    c: compe ?? null,
    n: displayNames.get(ispb) ?? prettify(name),
    l: `${format}:${logoIspb ?? ispb}`,
  });
}

list.sort((a, b) => a.n.localeCompare(b.n, "pt-BR"));

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src", "data", "instituicoes.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(list));
console.log(`${list.length} instituições com logo gravadas em ${out}`);
