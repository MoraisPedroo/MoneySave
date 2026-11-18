import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FinanceProvider } from "@/context/finance-context";
import { DialogsProvider } from "@/context/dialogs-context";
import { TutorialProvider } from "@/context/tutorial-context";
import { AppShell } from "@/components/layout/app-shell";
import { AppToaster } from "@/components/layout/app-toaster";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MoneySave — controle de cartões, assinaturas e metas",
    template: "%s · MoneySave",
  },
  description:
    "Organize sua vida financeira: lance gastos diários e contas, veja quanto sobra no mês, controle cartões e assinaturas por banco e descubra quanto guardar para cada objetivo.",
  applicationName: "MoneySave",
  appleWebApp: { capable: true, title: "MoneySave", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1017" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh font-sans">
        <FinanceProvider>
          <DialogsProvider>
            <TutorialProvider>
              <AppShell>{children}</AppShell>
            </TutorialProvider>
          </DialogsProvider>
        </FinanceProvider>
        <AppToaster />
      </body>
    </html>
  );
}
