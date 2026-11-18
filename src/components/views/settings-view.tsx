"use client";

import { useRef } from "react";
import { Cloud, Download, HardDrive, LogIn, LogOut, Monitor, Moon, Sparkles, Sun, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/context/finance-context";
import { useDialogs } from "@/context/dialogs-context";
import { buildBackup, parseBackup } from "@/lib/backup";
import { INSTITUTION_COUNT } from "@/lib/banks";
import { todayISO } from "@/lib/format";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { EMPTY_DATA } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Segmented } from "@/components/ui/misc";

export function SettingsView() {
  const { mode, user, data, signIn, signOutUser, exitLocal, cloudAvailable, replaceAll, loadSample, localDataAvailable, importLocalToCloud } = useFinance();
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
            <CardTitle>Conta e sincronização</CardTitle>
            <CardDescription>Onde seus dados ficam guardados</CardDescription>
          </div>
          {mode === "cloud" ? (
            <Badge variant="success">
              <Cloud /> Nuvem
            </Badge>
          ) : (
            <Badge variant="warning">
              <HardDrive /> Local
            </Badge>
          )}
        </CardHeader>
        <CardContent className="grid gap-4">
          {mode === "cloud" && user ? (
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-accent-foreground">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                ) : (
                  initials(user.name)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-warning-soft p-3 text-sm">
              Você está no <strong>modo local</strong>: os dados ficam só neste navegador. Entre com o Google para guardar na nuvem e acessar
              do celular.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {mode === "cloud"
              ? "Seus dados ficam no Firebase (Cloud Firestore) e sincronizam em tempo real entre seus dispositivos. As regras de segurança garantem que só a sua conta tem acesso."
              : "Ao entrar com o Google, você pode enviar estes dados para a sua conta."}
          </p>
          <div className="flex flex-wrap gap-2">
            {mode === "cloud" ? (
              <>
                {localDataAvailable ? (
                  <Button variant="soft" onClick={() => void importLocalToCloud()}>
                    <Upload /> Enviar dados do modo local
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => void signOutUser()}>
                  <LogOut /> Sair da conta
                </Button>
              </>
            ) : (
              <>
                {cloudAvailable ? (
                  <Button onClick={() => void signIn()}>
                    <LogIn /> Entrar com Google
                  </Button>
                ) : null}
                <Button variant="outline" onClick={exitLocal}>
                  <LogOut /> Sair do modo local
                </Button>
              </>
            )}
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
            <CardDescription>Tema claro, escuro ou automático</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Segmented<ThemePreference>
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "Claro", icon: <Sun /> },
              { value: "dark", label: "Escuro", icon: <Moon /> },
              { value: "system", label: "Auto", icon: <Monitor /> },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Dados</CardTitle>
            <CardDescription>Exemplo para explorar ou começar do zero</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="soft"
            onClick={() =>
              confirm({
                title: "Substituir pelos dados de exemplo?",
                description: total
                  ? `Os ${total} registro(s) atuais serão apagados e trocados por exemplos (Nubank, Inter, PicPay e Sicoob). Faça um backup antes, se quiser.`
                  : "Vamos preencher com contas, cartões, assinaturas, lançamentos e metas de exemplo.",
                confirmLabel: "Carregar exemplo",
                destructive: total > 0,
                onConfirm: async () => {
                  const ok = await loadSample();
                  if (ok) toast.success("Dados de exemplo carregados!");
                },
              })
            }
          >
            <Sparkles /> Carregar dados de exemplo
          </Button>
          <Button
            variant="destructive-ghost"
            disabled={total === 0}
            onClick={() =>
              confirm({
                title: "Apagar todos os dados?",
                description: `Isso remove ${total} registro(s) ${mode === "cloud" ? "da sua conta na nuvem" : "deste navegador"} e não pode ser desfeito. Exporte um backup antes, se quiser guardar.`,
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
