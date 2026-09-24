"use client";

import { startTransition, useActionState, useState } from "react";
import { replyFeedback, type FeedbackFormState } from "@/lib/feedback-actions";
import { btnPrimaryCls, btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";

export default function FeedbackReplyForm({ id, currentReply }: { id: string; currentReply: string | null }) {
  const [editing, setEditing] = useState(!currentReply);
  const [state, formAction, pending] = useActionState(
    async (prev: FeedbackFormState, fd: FormData) => {
      const res = await replyFeedback(prev, fd);
      if (res.ok) setEditing(false);
      return res;
    },
    {} as FeedbackFormState,
  );

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className={`${btnSecondaryCls} w-full`}>
        Editar resposta
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="space-y-2"
    >
      <input type="hidden" name="id" value={id} />
      <label className="block space-y-1">
        <span className="text-sm font-medium">Sua resposta</span>
        <textarea
          name="reply"
          rows={3}
          maxLength={2000}
          defaultValue={currentReply ?? ""}
          placeholder="Ex.: Ótima semana! Vamos subir a carga no agachamento."
          className={`${inputCls} !h-auto py-2`}
        />
      </label>
      {state.error && <p role="alert" className={errorCls}>{state.error}</p>}
      <div className="flex gap-2">
        {currentReply && (
          <button type="button" onClick={() => setEditing(false)} disabled={pending} className={`${btnSecondaryCls} flex-1`}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={pending} className={`${btnPrimaryCls} flex-1`}>
          {pending ? "Salvando..." : "Enviar resposta"}
        </button>
      </div>
    </form>
  );
}
