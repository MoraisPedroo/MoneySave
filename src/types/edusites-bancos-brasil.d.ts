declare module "@edusites/bancos-brasil/core" {
  export interface SvgBancoOptions {
    nome: string;
    formato?: "quadrado" | "circulo" | "sem";
    cor?: string;
    fundo?: string;
    tamanho?: number;
    className?: string;
  }
  export function svgBanco(options: SvgBancoOptions): string | null | Promise<string | null>;
  export function svgBancoSync(options: SvgBancoOptions): string | null;
  export function svgBancoAsync(options: SvgBancoOptions): Promise<string | null>;
  export function listarBancos(): string[];
  export function obterPreset(nome: string): { cor: string; fundo: string; formato: string; tamanho: number } | null;
}
