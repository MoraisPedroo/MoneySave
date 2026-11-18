import type { Metadata } from "next";
import { SettingsView } from "@/components/views/settings-view";

// Página liberada só depois do login/modo local (decidido no navegador pelo AppShell).
export const instant = false;

export const metadata: Metadata = { title: "Ajustes" };

export default function SettingsPage() {
  return <SettingsView />;
}
