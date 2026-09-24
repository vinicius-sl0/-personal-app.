"use client";

import { useState } from "react";
import { setTrainingDays } from "@/lib/attendance-actions";
import { trainingDaysText, WEEKDAYS } from "@/lib/attendance";
import { btnPrimaryCls, btnSecondaryCls, errorCls } from "@/lib/ui";

export default function TrainingDaysEditor({ studentId, initial }: { studentId: string; initial: number[] }) {
  const [editing, setEditing] = useState(initial.length === 0);
  const [days, setDays] = useState<number[]>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(value: number) {
    setDays((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await setTrainingDays(studentId, days);
      if (res.error) setError(res.error);
      else setEditing(false);
    } catch (err) {
      console.error("setTrainingDays:", err);
      setError("Falha de conexão ao salvar os dias. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <span>
          <span className="block text-xs text-zinc-500">Dias combinados</span>
          <span className="font-medium">{trainingDaysText(initial)}</span>
        </span>
        <button type="button" onClick={() => setEditing(true)} className={`${btnSecondaryCls} !h-9 shrink-0`}>
          Alterar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium">Em quais dias o aluno deve treinar?</p>
      <p className="text-xs text-zinc-500">
        Dia marcado sem check-in aparece como “Não foi”. Treino em dia não marcado conta como extra.
      </p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => {
          const on = days.includes(w.value);
          return (
            <button
              key={w.value}
              type="button"
              aria-pressed={on}
              aria-label={w.long}
              onClick={() => toggle(w.value)}
              className={`h-11 rounded-lg border text-xs font-semibold transition ${
                on
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {w.short}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className={errorCls}>{error}</p>}
      <div className="flex gap-2">
        {initial.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setDays(initial);
              setEditing(false);
              setError(null);
            }}
            disabled={saving}
            className={`${btnSecondaryCls} flex-1`}
          >
            Cancelar
          </button>
        )}
        <button type="button" onClick={save} disabled={saving} className={`${btnPrimaryCls} flex-1`}>
          {saving ? "Salvando..." : "Salvar dias"}
        </button>
      </div>
    </div>
  );
}
