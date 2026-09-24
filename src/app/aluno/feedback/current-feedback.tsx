"use client";

import { useState } from "react";
import FeedbackAnswers from "@/components/feedback-answers";
import FeedbackForm from "@/components/feedback-form";
import type { Feedback } from "@/lib/feedback";
import { btnSecondaryCls } from "@/lib/ui";

// Feedback da semana atual: formulário (novo ou em edição) ou as respostas já enviadas.
export default function CurrentFeedback({ feedback }: { feedback: Feedback | null }) {
  const [editing, setEditing] = useState(!feedback);
  const [justSent, setJustSent] = useState(false);

  if (editing || !feedback) {
    return (
      <div className="space-y-3">
        <FeedbackForm
          initial={feedback}
          onDone={() => {
            setEditing(false);
            setJustSent(true);
          }}
        />
        {feedback && (
          <button type="button" onClick={() => setEditing(false)} className={`${btnSecondaryCls} w-full`}>
            Cancelar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {justSent && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Feedback enviado! Seu Personal vai ver suas respostas.
        </p>
      )}
      <FeedbackAnswers feedback={feedback} showWeek={false} />
      {feedback.replied_at ? (
        <p className="text-xs text-zinc-500">Já respondido pelo Personal, por isso não pode mais ser alterado.</p>
      ) : (
        <button
          type="button"
          onClick={() => {
            setJustSent(false);
            setEditing(true);
          }}
          className={`${btnSecondaryCls} w-full`}
        >
          Corrigir respostas
        </button>
      )}
    </div>
  );
}
