"use client";

import { useActionState } from "react";
import ConsentFields from "@/components/consent-fields";
import { btnPrimaryCls, errorCls } from "@/lib/ui";
import { acceptTerms, type TermsState } from "./actions";

const initialState: TermsState = {};

export default function TermsForm({ minor }: { minor: boolean }) {
  const [state, formAction, pending] = useActionState(acceptTerms, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <ConsentFields minor={minor} />
      {state.error && <p role="alert" className={errorCls}>{state.error}</p>}
      <button type="submit" disabled={pending} className={btnPrimaryCls}>
        {pending ? "Salvando..." : "Aceitar e continuar"}
      </button>
    </form>
  );
}
