"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Trash2 } from "lucide-react";
import type { ExerciseOption } from "@/components/exercise-picker";
import { inputCls } from "@/lib/ui";
import { repsLabel, TECHNIQUE_DETAIL_FIELD, TECHNIQUE_LABEL, techniqueExplanation, type Technique } from "@/lib/workout-labels";
import { Badge } from "@/components/ui/badge";
import type { ExerciseItemInput } from "./schema";

export type EditorExercise = ExerciseItemInput & { uid: string }; // uid: só para arrastar (não vai ao banco)

const fieldCls = `${inputCls} !h-10 text-sm`;
const numOrNull = (v: string) => (v === "" ? null : Number(v));

// Card de um exercício na ficha: arrastável (mouse, toque e teclado), com os campos ao expandir.
export default function ExerciseCard({
  item,
  index,
  total,
  info,
  open,
  onToggle,
  onChange,
  onRemove,
  onMove,
}: {
  item: EditorExercise;
  index: number;
  total: number;
  info?: ExerciseOption;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<ExerciseItemInput>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const detailField = TECHNIQUE_DETAIL_FIELD[item.technique];
  const explanation = techniqueExplanation(item.technique, item.technique_detail);
  const name = info?.name ?? "Exercício";
  const summary = [
    `${item.sets}× ${repsLabel(item.reps_min, item.reps_max, item.reps_text)}`,
    item.target_load_kg ? `${item.target_load_kg} kg` : null,
    item.rest_seconds ? `${item.rest_seconds}s descanso` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border bg-card transition-shadow ${
        isDragging ? "z-10 border-brand shadow-[0_18px_40px_-16px_rgb(0_0_0/0.6)]" : "border-line"
      }`}
    >
      <div className="flex items-center gap-2 p-2 pr-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Arrastar ${name} para mudar a ordem`}
          className="grid size-10 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-muted hover:bg-subtle hover:text-ink active:cursor-grabbing"
        >
          <GripVertical aria-hidden className="size-5" />
        </button>
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-lg bg-subtle-strong text-xs font-bold text-soft">
          {index + 1}
        </span>
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 py-1 text-left">
          <span className="block truncate font-medium">{name}</span>
          <span className="block truncate text-xs text-muted">
            {summary}
            {item.technique !== "normal" && ` · ${TECHNIQUE_LABEL[item.technique]}`}
          </span>
        </button>
        {info?.muscle_group && <Badge tone="neutral" className="hidden sm:inline-flex">{info.muscle_group}</Badge>}
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Mover para cima" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink disabled:opacity-30">
            <ArrowUp aria-hidden className="size-4" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Mover para baixo" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink disabled:opacity-30">
            <ArrowDown aria-hidden className="size-4" />
          </button>
          <button type="button" onClick={onToggle} aria-label={open ? "Fechar detalhes" : "Editar detalhes"} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink">
            <ChevronDown aria-hidden className={`size-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade-in space-y-3 border-t border-line p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <label className="space-y-1 text-xs text-muted">
              Séries
              <input type="number" inputMode="numeric" min={1} max={50} value={item.sets} onChange={(e) => onChange({ sets: Number(e.target.value) })} className={fieldCls} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Reps. mín.
              <input type="number" inputMode="numeric" min={1} max={1000} value={item.reps_min ?? ""} onChange={(e) => onChange({ reps_min: numOrNull(e.target.value) })} className={fieldCls} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Reps. máx.
              <input type="number" inputMode="numeric" min={1} max={1000} value={item.reps_max ?? ""} onChange={(e) => onChange({ reps_max: numOrNull(e.target.value) })} className={fieldCls} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Carga (kg)
              <input type="number" inputMode="decimal" min={0} step="0.5" value={item.target_load_kg ?? ""} onChange={(e) => onChange({ target_load_kg: numOrNull(e.target.value) })} className={fieldCls} />
            </label>
            <label className="col-span-2 space-y-1 text-xs text-muted sm:col-span-1">
              Descanso (s)
              <input type="number" inputMode="numeric" min={0} max={3600} value={item.rest_seconds ?? ""} onChange={(e) => onChange({ rest_seconds: numOrNull(e.target.value) })} className={fieldCls} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-muted">
              Reps. em texto (opcional, substitui mín./máx.)
              <input value={item.reps_text ?? ""} onChange={(e) => onChange({ reps_text: e.target.value || null })} placeholder='Ex.: "até a falha"' className={fieldCls} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Técnica
              <select
                value={item.technique}
                onChange={(e) =>
                  onChange({ technique: e.target.value as Technique, technique_detail: e.target.value === "normal" ? null : item.technique_detail })
                }
                className={fieldCls}
              >
                {(Object.keys(TECHNIQUE_LABEL) as Technique[]).map((t) => (
                  <option key={t} value={t}>
                    {TECHNIQUE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {detailField && (
            <label className="block space-y-1 text-xs text-muted">
              {detailField.label}
              <input value={item.technique_detail ?? ""} onChange={(e) => onChange({ technique_detail: e.target.value || null })} placeholder={detailField.placeholder} className={fieldCls} />
            </label>
          )}

          <label className="block space-y-1 text-xs text-muted">
            Observação (opcional)
            <input value={item.notes ?? ""} onChange={(e) => onChange({ notes: e.target.value || null })} placeholder="Ex.: cadência lenta na descida" className={fieldCls} />
          </label>

          {explanation && (
            <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs text-ink">
              <strong className="text-brand-ink">Como o aluno vai ver:</strong> {explanation}
            </p>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400">
              <Trash2 aria-hidden className="size-3.5" /> Remover exercício
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
