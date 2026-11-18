import type { Metadata } from "next";
import { TransactionsView } from "@/components/views/transactions-view";

// Página liberada só depois do login/modo local (decidido no navegador pelo AppShell).
export const instant = false;

export const metadata: Metadata = { title: "Lançamentos" };

export default function TransactionsPage() {
  return <TransactionsView />;
}
