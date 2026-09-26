"use client";

import { useMemo, useState } from "react";
import { btnSecondaryCls, inputCls } from "@/lib/ui";

export type ExerciseOption = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
};

export default function ExercisePicker({
  exercises,
  onAdd,
}: {
  exercises: ExerciseOption[];
  onAdd: (exercise: ExerciseOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return exercises.slice(0, 30);
    return exercises.filter((e) => e.name.toLowerCase().includes(term)).slice(0, 30);
  }, [exercises, q]);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={btnSecondaryCls}>
        + Adicionar exercício
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-80 max-w-[90vw] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar exercício..."
            className={`${inputCls} !h-10 mb-2`}
          />
          <ul className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="p-2 text-sm text-muted">Nenhum exercício encontrado.</li>
            )}
            {filtered.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(ex);
                    setOpen(false);
                    setQ("");
                  }}
                  className="flex w-full flex-col items-start rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-xs text-muted">
                    {ex.muscle_group}
                    {ex.equipment ? ` · ${ex.equipment}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
