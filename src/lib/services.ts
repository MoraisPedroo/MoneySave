/** Serviços de assinatura conhecidos (cor de marca + categoria sugerida). */
export interface ServicePreset {
  slug: string;
  name: string;
  color: string;
  category: string;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { slug: "netflix", name: "Netflix", color: "#E50914", category: "streaming" },
  { slug: "spotify", name: "Spotify", color: "#1DB954", category: "musica" },
  { slug: "prime", name: "Amazon Prime", color: "#00A8E1", category: "streaming" },
  { slug: "disney", name: "Disney+", color: "#113CCF", category: "streaming" },
  { slug: "max", name: "Max", color: "#002BE7", category: "streaming" },
  { slug: "globoplay", name: "Globoplay", color: "#FB0234", category: "streaming" },
  { slug: "youtube", name: "YouTube Premium", color: "#FF0000", category: "streaming" },
  { slug: "paramount", name: "Paramount+", color: "#0064FF", category: "streaming" },
  { slug: "appletv", name: "Apple TV+", color: "#1D1D1F", category: "streaming" },
  { slug: "crunchyroll", name: "Crunchyroll", color: "#F47521", category: "streaming" },
  { slug: "deezer", name: "Deezer", color: "#A238FF", category: "musica" },
  { slug: "applemusic", name: "Apple Music", color: "#FA243C", category: "musica" },
  { slug: "icloud", name: "iCloud+", color: "#3693F3", category: "nuvem" },
  { slug: "googleone", name: "Google One", color: "#4285F4", category: "nuvem" },
  { slug: "microsoft365", name: "Microsoft 365", color: "#D83B01", category: "software" },
  { slug: "chatgpt", name: "ChatGPT", color: "#10A37F", category: "software" },
  { slug: "claude", name: "Claude", color: "#D97757", category: "software" },
  { slug: "canva", name: "Canva", color: "#00C4CC", category: "software" },
  { slug: "adobe", name: "Adobe", color: "#FA0F00", category: "software" },
  { slug: "gamepass", name: "Xbox Game Pass", color: "#107C10", category: "jogos" },
  { slug: "psplus", name: "PlayStation Plus", color: "#003791", category: "jogos" },
  { slug: "nintendo", name: "Nintendo Online", color: "#E60012", category: "jogos" },
  { slug: "duolingo", name: "Duolingo", color: "#58CC02", category: "educacao" },
  { slug: "academia", name: "Academia", color: "#F43F5E", category: "saude" },
  { slug: "ifood", name: "iFood Clube", color: "#EA1D2C", category: "clubes" },
  { slug: "uberone", name: "Uber One", color: "#000000", category: "clubes" },
  { slug: "meli", name: "Meli+", color: "#FFE600", category: "clubes" },
  { slug: "kindle", name: "Kindle Unlimited", color: "#FF9900", category: "noticias" },
];

const bySlug = new Map(SERVICE_PRESETS.map((service) => [service.slug, service]));

export function getService(slug?: string | null): ServicePreset | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

/** Tenta reconhecer o serviço pelo nome digitado (ex.: "netflix premium" → netflix). */
export function guessService(name: string): ServicePreset | undefined {
  const text = name.toLowerCase();
  return SERVICE_PRESETS.find((service) => text.includes(service.name.toLowerCase().split(" ")[0]));
}
