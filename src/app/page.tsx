import { DashboardView } from "@/components/views/dashboard-view";

// Página liberada só depois do login/modo local (decidido no navegador pelo AppShell).
export const instant = false;

export default function HomePage() {
  return <DashboardView />;
}
