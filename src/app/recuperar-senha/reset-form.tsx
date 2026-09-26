"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { requestPasswordReset, type ResetState } from "@/app/login/actions";
import { btnPrimaryCls, errorCls } from "@/lib/ui";
import { Field, Spinner } from "@/components/ui/field";

export default function ResetForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {} as ResetState);

  if (state.sent) {
    return (
      <div className="animate-slide-up space-y-5 text-sm">
        <div className="flex gap-3 rounded-2xl border border-line bg-card p-4">
          <MailCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-ink" />
          <p>
            Se esse e-mail tiver cadastro, você vai receber um link em instantes. Confira também a caixa de spam. O link
            vale por pouco tempo.
          </p>
        </div>
        <Link href="/login" className="font-medium text-brand-ink hover:underline">
          ← Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      <Field label="E-mail" name="email" type="email" inputMode="email" autoComplete="email" placeholder="voce@email.com" disabled={pending} />
      {state.error && (
        <p role="alert" className={errorCls}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnPrimaryCls}>
        {pending ? (
          <>
            <Spinner /> Enviando...
          </>
        ) : (
          "Enviar link"
        )}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-brand-ink hover:underline">
          Lembrei a senha
        </Link>
      </p>
    </form>
  );
}
