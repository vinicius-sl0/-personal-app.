"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { ErrorState } from "@/components/ui/states";
import { btnPrimaryCls, btnSecondaryCls } from "@/lib/ui";

// Tela mostrada quando uma página quebra de forma inesperada. A mensagem do erro aparece
// literal (regra do projeto: erro nunca fica escondido) e há um botão para tentar de novo.
export default function RouteError({
  error,
  reset,
  homeHref,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Em produção o Next esconde a mensagem de erros do servidor e manda só um código (digest).
  const message = error.digest
    ? `Não foi possível abrir esta página. Tente de novo em instantes. (código: ${error.digest})`
    : error.message || "Não foi possível abrir esta página.";

  return (
    <section className="mx-auto max-w-lg space-y-4 py-8">
      <ErrorState message={message} />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} className={`${btnPrimaryCls} !w-auto px-5`}>
          <RotateCw aria-hidden className="size-4" />
          Tentar de novo
        </button>
        <Link href={homeHref} className={`${btnSecondaryCls} !w-auto px-5`}>
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
