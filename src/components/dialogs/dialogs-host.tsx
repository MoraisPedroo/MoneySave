"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useDialogs, type DialogRequest } from "@/context/dialogs-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionDialog } from "./transaction-dialog";
import { CardDialog } from "./card-dialog";
import { CardDetailsDialog } from "./card-details-dialog";
import { AccountDialog } from "./account-dialog";
import { SubscriptionDialog } from "./subscription-dialog";
import { DepositDialog, GoalDialog } from "./goal-dialogs";

/** Renderiza a janela (dialog) pedida em qualquer lugar do app. */
export function DialogsHost() {
  const { current, close, closeAll } = useDialogs();
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  // fecha qualquer janela ao trocar de página
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      closeAll();
    }
  }, [pathname, closeAll]);

  if (!current) return null;
  const { key } = current;

  switch (current.type) {
    case "transaction":
      return <TransactionDialog key={key} transaction={current.transaction} defaults={current.defaults} month={current.month} onClose={close} />;
    case "card":
      return <CardDialog key={key} card={current.card} onClose={close} />;
    case "card-details":
      return <CardDetailsDialog key={key} cardId={current.cardId} onClose={close} />;
    case "account":
      return <AccountDialog key={key} account={current.account} onClose={close} />;
    case "subscription":
      return <SubscriptionDialog key={key} subscription={current.subscription} onClose={close} />;
    case "goal":
      return <GoalDialog key={key} goal={current.goal} onClose={close} />;
    case "deposit":
      return <DepositDialog key={key} goal={current.goal} onClose={close} />;
    case "confirm":
      return <ConfirmDialog key={key} request={current} onClose={close} onDone={closeAll} />;
    default:
      return null;
  }
}

function ConfirmDialog({
  request,
  onClose,
  onDone,
}: {
  request: Extract<DialogRequest, { type: "confirm" }>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    try {
      await request.onConfirm();
    } finally {
      setBusy(false);
      // confirmou: fecha também a janela que pediu a confirmação (ex.: edição do item excluído)
      onDone();
    }
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader className="pt-5 pr-5">
          <DialogTitle>{request.title}</DialogTitle>
          {request.description ? <DialogDescription>{request.description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant={request.destructive ? "destructive" : "default"} onClick={handleConfirm} disabled={busy}>
            {busy ? "Aguarde…" : (request.confirmLabel ?? "Confirmar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
