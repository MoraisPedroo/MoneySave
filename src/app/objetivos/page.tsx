import type { Metadata } from "next";
import { GoalsView } from "@/components/views/goals-view";

// Página liberada só depois do login/modo local (decidido no navegador pelo AppShell).
export const instant = false;

export const metadata: Metadata = { title: "Objetivos" };

export default function GoalsPage() {
  return <GoalsView />;
}
