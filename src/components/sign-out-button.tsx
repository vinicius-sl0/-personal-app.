"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { unsubscribeThisDevice } from "@/lib/push-client";
import { btnSecondaryCls } from "@/lib/ui";

// Sair da conta. Antes, desliga os avisos no celular DESTE aparelho: num celular compartilhado,
// os avisos de uma pessoa não podem continuar chegando para quem usar depois.
export function SignOutButton({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      // não deixa a saída travar se a internet estiver ruim
      await Promise.race([unsubscribeThisDevice().catch(() => undefined), new Promise((r) => setTimeout(r, 4000))]);
    } finally {
      await signOut();
    }
  }

  if (variant === "full") {
    return (
      <button type="button" onClick={handle} disabled={busy} className={btnSecondaryCls}>
        <LogOut aria-hidden className="size-4" /> {busy ? "Saindo..." : "Sair da conta"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      aria-label="Sair"
      title="Sair"
      className="rounded-lg p-2 text-muted transition hover:bg-subtle hover:text-ink disabled:opacity-50"
    >
      <LogOut aria-hidden className="size-4" />
    </button>
  );
}
