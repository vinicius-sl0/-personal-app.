"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { signIn, type LoginState } from "./actions";
import { btnPrimaryCls, errorCls, successCls } from "@/lib/ui";
import { Field, Spinner } from "@/components/ui/field";

const initialState: LoginState = {};

// Estados: campos inválidos (antes de enviar e vindos do servidor), carregando, erro e login realizado.
export default function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [local, setLocal] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (state.redirectTo) router.replace(state.redirectTo);
  }, [state.redirectTo, router]);

  const fieldErrors = { ...state.fieldErrors, ...local };
  const done = !!state.redirectTo;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get("email") ?? "").trim();
        const errs: typeof local = {};
        if (!email) errs.email = "Informe seu e-mail.";
        else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Esse e-mail não parece válido.";
        if (!String(fd.get("password") ?? "")) errs.password = "Informe sua senha.";
        setLocal(errs);
        if (Object.keys(errs).length === 0) startTransition(() => formAction(fd));
      }}
    >
      <Field
        label="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="voce@email.com"
        error={fieldErrors.email}
        disabled={pending || done}
        onChange={() => local.email && setLocal((l) => ({ ...l, email: undefined }))}
      />
      <div className="space-y-2">
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          error={fieldErrors.password}
          disabled={pending || done}
          onChange={() => local.password && setLocal((l) => ({ ...l, password: undefined }))}
        />
        <div className="text-right">
          <Link href="/recuperar-senha" className="text-sm font-medium text-brand-ink hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </div>

      {state.error && (
        <p role="alert" className={errorCls}>
          {state.error}
        </p>
      )}
      {done && (
        <p role="status" className={`${successCls} flex items-center gap-2`}>
          <CheckCircle2 aria-hidden className="size-4 animate-pop" /> Login realizado! Abrindo sua área...
        </p>
      )}

      <button type="submit" disabled={pending || done} className={btnPrimaryCls}>
        {pending || done ? (
          <>
            <Spinner /> {done ? "Redirecionando..." : "Entrando..."}
          </>
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  );
}
