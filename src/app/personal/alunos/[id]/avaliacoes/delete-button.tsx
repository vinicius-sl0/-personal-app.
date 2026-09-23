"use client";

import { useActionState } from "react";
import { btnSecondaryCls, errorCls } from "@/lib/ui";
import type { AssessmentFormState } from "./actions";

export default function DeleteAssessmentButton({
  action,
}: {
  action: (prev: AssessmentFormState, fd: FormData) => Promise<AssessmentFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {} as AssessmentFormState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Excluir esta avaliação? Todas as medidas dela serão apagadas e isso não pode ser desfeito.")) {
          e.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <button
        type="submit"
        disabled={pending}
        className={`${btnSecondaryCls} w-full text-red-700 dark:text-red-400`}
      >
        {pending ? "Excluindo..." : "Excluir avaliação"}
      </button>
      {state.error && (
        <p role="alert" className={errorCls}>
          {state.error}
        </p>
      )}
    </form>
  );
}
