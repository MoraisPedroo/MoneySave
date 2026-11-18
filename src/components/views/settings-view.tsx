"use client";

import { useRef } from "react";
import { Cloud, Download, GraduationCap, LogOut, Monitor, Moon, RotateCcw, Sun, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { useTutorial } from "@/context/tutorial-context";
import { buildBackup, parseBackup } from "@/lib/backup";
import { INSTITUTION_COUNT } from "@/lib/banks";
import { todayISO } from "@/lib/format";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { EMPTY_DATA } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Segmented } from "@/components/ui/misc";
import { Pet } from "@/components/pet/pet";

export function SettingsView() {
  const { user, data, signOutUser, replaceAll, profile, updateProfile } = useFinance();
  const { start } = useTutorial();
  const { confirm } = useDialogs();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const counts = {
    contas: data.accounts.length,
    cartões: data.cards.length,
    assinaturas: data.subscriptions.length,
    lançamentos: data.transactions.length,
    objetivos: data.goals.length,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const exportBackup = () => {
    const blob = new Blob([buildBackup(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `moneysave-backup-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Backup baixado.");
  };

  const handleImport = async (file: File) => {
    try {
      const imported = parseBackup(await file.text());
      const importedTotal = Object.values(imported).reduce((acc, list) => acc + list.length, 0);
      confirm({
        title: "Restaurar este backup?",
        description: `O arquivo tem ${importedTotal} registro(s). Os dados atuais (${total} registro(s)) serão substituídos.`,
        confirmLabel: "Restaurar backup",
        destructive: true,
        onConfirm: async () => {
          const ok = await replaceAll(imported);
          if (ok) toast.success("Backup restaurado!");
        },
      });
    } catch (error) {
      toast.error("Não foi possível ler o arquivo.", { description: (error as Error).message });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Seus dados ficam na nuvem, na sua conta Google</CardDescription>
          </div>
          <Badge variant="success">
            <Cloud /> Sincronizado
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-accent-foreground">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
              ) : (
                initials(user?.name ?? "?")
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{user?.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Tudo fica no Firebase (Cloud Firestore) e sincroniza em tempo real entre celular e computador. As regras de segurança garantem que só a
            sua conta tem acesso.
          </p>
          <Button variant="outline" className="justify-self-start" onClick={() => void signOutUser()}>
            <LogOut /> Sair da conta
          </Button>
        </CardContent>
      </Card>

      <Card data-tour="settings-tutorial">
        <CardHeader>
          <div>
            <CardTitle>Tutorial e assistente</CardTitle>
            <CardDescription>Reveja como o MoneySave funciona quando quiser</CardDescription>
          </div>
          <Pet size={46} />
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            O tutorial usa <strong>dados de exemplo</strong> só na tela — seus dados não são alterados e voltam ao final.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={start}>
              <GraduationCap /> Refazer tutorial
            </Button>
            {profile.onboardingDone ? (
              <Button
                variant="outline"
                onClick={() => {
                  updateProfile({ onboardingDone: false, skippedSteps: [] });
                  toast.success("O Poupinho e o checklist voltaram para a tela inicial.");
                }}
              >
                <RotateCcw /> Mostrar o checklist de novo
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Backup dos dados</CardTitle>
            <CardDescription>Exporte ou restaure tudo em um arquivo JSON</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(counts).map(([label, count]) => (
              <Badge key={label} variant="secondary">
                {count} {label}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportBackup} disabled={total === 0}>
              <Download /> Exportar backup
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload /> Importar backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleImport(file);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Também dá para trocar no botão de sol/lua lá em cima</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Segmented<ThemePreference>
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "Claro", icon: <Sun /> },
              { value: "dark", label: "Escuro", icon: <Moon /> },
              { value: "system", label: "Auto", icon: <Monitor /> },
            ]}
          />
          <div className="border-t pt-4">
            <p className="text-sm font-medium">Zona de perigo</p>
            <p className="mb-3 text-xs text-muted-foreground">Apaga todos os seus dados da nuvem. Não dá para desfazer.</p>
            <Button
              variant="destructive-ghost"
              disabled={total === 0}
              onClick={() =>
                confirm({
                  title: "Apagar todos os dados?",
                  description: `Isso remove ${total} registro(s) da sua conta na nuvem e não pode ser desfeito. Exporte um backup antes, se quiser guardar.`,
                  confirmLabel: "Apagar tudo",
                  destructive: true,
                  onConfirm: async () => {
                    const ok = await replaceAll(EMPTY_DATA);
                    if (ok) toast.success("Todos os dados foram apagados.");
                  },
                })
              }
            >
              <Trash2 /> Apagar todos os dados
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="grid gap-1 pt-5 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">MoneySave</strong> · Next.js, Tailwind CSS, Firebase (Auth + Firestore) e Vercel.
          </p>
          <p>
            Logos: símbolos vetoriais de <code>@edusites/bancos-brasil</code> (MIT) e {INSTITUTION_COUNT} logos de instituições do Banco Central via{" "}
            <code>logos-bancos-br</code>. As marcas pertencem às respectivas instituições e são usadas apenas para identificação.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
