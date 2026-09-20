"use client";

import { useState } from "react";
import { btnSecondaryCls } from "@/lib/ui";

export default function InviteLink({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const firstName = name.trim().split(" ")[0];
  const message = `Olá, ${firstName}! Este é o seu acesso à plataforma de treinos: ${url}\n\nO link vale por 7 dias e só pode ser usado uma vez.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        Link de convite de {name}
      </p>
      <p className="break-all rounded-lg bg-white/70 p-2 font-mono text-xs dark:bg-black/30">{url}</p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Aparece só agora: por segurança, o sistema guarda apenas uma versão criptografada. Vale por 7
        dias e uma única vez. Se perder, gere outro na lista de alunos.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={btnSecondaryCls}>
          {copied ? "Copiado!" : "Copiar link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btnSecondaryCls}
        >
          Enviar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}
