import type { Metadata } from "next";
import { SubscriptionsView } from "@/components/views/subscriptions-view";

// Página liberada só depois do login/modo local (decidido no navegador pelo AppShell).
export const instant = false;

export const metadata: Metadata = { title: "Assinaturas" };

export default function SubscriptionsPage() {
  return <SubscriptionsView />;
}
