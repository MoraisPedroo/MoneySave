import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoneySave — controle financeiro",
    short_name: "MoneySave",
    description: "Cartões, assinaturas, contas e metas em um só lugar.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#10b981",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
