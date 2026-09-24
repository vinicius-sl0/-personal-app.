"use client";

import { startTransition, useActionState } from "react";
import { saveFeedback, type FeedbackFormState } from "@/lib/feedback-actions";
import { SCALES, TEXT_MAX, type Feedback } from "@/lib/feedback";
import { btnPrimaryCls, errorCls, inputCls } from "@/lib/ui";

const TEXTS: { name: "difficulties" | "pain_notes" | "comment"; label: string; placeholder?: string; rows: number }[] = [
  { name: "difficulties", label: "Sentiu alguma dificuldade?", placeholder: "Ex.: difícil encaixar o treino no horário", rows: 2 },
  { name: "pain_notes", label: "Teve alguma dor ou desconforto?", placeholder: "Ex.: joelho direito incomodou no agachamento", rows: 2 },
  { name: "comment", label: "Observações adicionais", rows: 3 },
];

export default function FeedbackForm({ initial, onDone }: { initial: Feedback | null; onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: FeedbackFormState, fd: FormData) => {
      const res = await saveFeedback(prev, fd);
      if (res.ok) onDone?.();
      return res;
    },
    {} as FeedbackFormState,
  );

  return (
    // onSubmit em vez de action={...}: assim o React não limpa o formulário quando volta um erro.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="space-y-5"
      noValidate
    >
      {SCALES.map((s) => (
        <fieldset key={s.field} className="space-y-2">
          <legend className="text-sm font-medium">{s.label}</legend>
          <div className="grid grid-cols-5 gap-1.5">
            {s.levels.map((label, i) => {
              const value = i + 1;
              return (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name={s.field}
                    value={value}
                    defaultChecked={initial?.[s.field] === value}
                    className="peer sr-only"
                  />
                  <span className="flex h-16 flex-col items-center justify-center rounded-lg border border-zinc-300 px-1 text-center transition peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/30 dark:border-zinc-700 dark:peer-checked:border-zinc-100 dark:peer-checked:bg-zinc-100 dark:peer-checked:text-zinc-900">
                    <span className="text-base font-bold">{value}</span>
                    <span className="text-[10px] leading-tight">{label}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {TEXTS.map((t) => (
        <label key={t.name} className="block space-y-1">
          <span className="text-sm font-medium">
            {t.label} <span className="font-normal text-zinc-500">(opcional)</span>
          </span>
          <textarea
            name={t.name}
            rows={t.rows}
            maxLength={TEXT_MAX}
            defaultValue={initial?.[t.name] ?? ""}
            placeholder={t.placeholder}
            className={`${inputCls} !h-auto py-2`}
          />
        </label>
      ))}

      {state.error && <p role="alert" className={errorCls}>{state.error}</p>}

      <button type="submit" disabled={pending} className={btnPrimaryCls}>
        {pending ? "Enviando..." : initial ? "Salvar alterações" : "Enviar feedback"}
      </button>
    </form>
  );
}
