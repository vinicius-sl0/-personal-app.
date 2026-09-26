"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { updatePassword, type NewPasswordState } from "@/app/login/actions";
import { btnPrimaryCls, errorCls, successCls } from "@/lib/ui";
import { Field, Spinner } from "@/components/ui/field";

export default function NewPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePassword, {} as NewPasswordState);

  useEffect(() => {
    if (!state.redirectTo) return;
    const t = setTimeout(() => router.replace(state.redirectTo!), 1200);
    return () => clearTimeout(t);
  }, [state.redirectTo, router]);

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
      <Field label="Nova senha" name="password" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres." disabled={pending || !!state.redirectTo} />
      <Field label="Repita a nova senha" name="confirm" type="password" autoComplete="new-password" disabled={pending || !!state.redirectTo} />
      {state.error && (
        <p role="alert" className={errorCls}>
          {state.error}
        </p>
      )}
      {state.redirectTo && (
        <p role="status" className={`${successCls} flex items-center gap-2`}>
          <CheckCircle2 aria-hidden className="size-4 animate-pop" /> Senha alterada! Entrando...
        </p>
      )}
      <button type="submit" disabled={pending || !!state.redirectTo} className={btnPrimaryCls}>
        {pending ? (
          <>
            <Spinner /> Salvando...
          </>
        ) : (
          "Salvar nova senha"
        )}
      </button>
    </form>
  );
}
