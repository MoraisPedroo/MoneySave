import type { Metadata } from "next";
import { CardsView } from "@/components/views/cards-view";

// Página liberada só depois do login/modo local (decidido no navegador pelo AppShell).
export const instant = false;

export const metadata: Metadata = { title: "Cartões e contas" };

export default function CardsPage() {
  return <CardsView />;
}
