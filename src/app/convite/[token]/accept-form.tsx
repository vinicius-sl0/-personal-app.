"use client";

import { useActionState } from "react";
import ConsentFields from "@/components/consent-fields";
import { btnPrimaryCls, errorCls, inputCls } from "@/lib/ui";
import { acceptInvite, type AcceptState } from "./actions";

const initialState: AcceptState = {};

export default function AcceptForm({
  token,
  email,
  minor,
}: {
  token: string;
  email: string;
  minor: boolean;
}) {
  const [state, formAction, pending] = useActionState(acceptInvite, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">E-mail</label>
        <input value={email} readOnly className={`${inputCls} opacity-70`} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Crie uma senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputCls}
        />
        <p className="text-xs text-muted">Mínimo de 8 caracteres.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-sm font-medium">
          Repita a senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className={inputCls}
        />
      </div>

      <ConsentFields minor={minor} />

      {state.error && <p role="alert" className={errorCls}>{state.error}</p>}

      <button type="submit" disabled={pending} className={btnPrimaryCls}>
        {pending ? "Criando conta..." : "Ativar minha conta"}
      </button>
    </form>
  );
}
