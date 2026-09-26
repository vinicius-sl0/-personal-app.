"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ExercisePicker, { type ExerciseOption } from "@/components/exercise-picker";
import VolumeSummary from "@/components/volume-summary";
import { plannedInput, type MuscleMap, type VolumeInput } from "@/lib/volume";
import { btnPrimaryCls, btnSecondaryCls, cardCls, errorCls, inputCls, labelCls } from "@/lib/ui";
import { Spinner } from "@/components/ui/field";
import type { PlanFormState } from "./actions";
import { planSchema, type ExerciseItemInput, type WorkoutInput } from "./schema";
import ExerciseCard, { type EditorExercise } from "./exercise-card";

type Workout = Omit<WorkoutInput, "exercises"> & { key: string; exercises: EditorExercise[] };

let uid = 0;
const newKey = () => `k${Date.now()}_${uid++}`;

function emptyExercise(exercise_id: string): EditorExercise {
  return {
    uid: newKey(),
    exercise_id,
    sets: 3,
    reps_min: 8,
    reps_max: 12,
    reps_text: null,
    target_load_kg: null,
    rest_seconds: 60,
    technique: "normal",
    technique_detail: null,
    notes: null,
  };
}

function emptyWorkout(index: number): Workout {
  return { key: newKey(), name: `Treino ${String.fromCharCode(65 + index)}`, notes: null, exercises: [] };
}

export default function PlanEditor({
  studentId,
  studentName,
  exercises,
  exerciseIndex,
  action,
  initialPlan,
  planId,
  muscleMap = {},
  secondaryWeight = 0.5,
}: {
  studentId: string;
  studentName: string;
  exercises: ExerciseOption[];
  exerciseIndex: Record<string, ExerciseOption>;
  action: (status: "rascunho" | "ativo", prev: PlanFormState, fd: FormData) => Promise<PlanFormState>;
  initialPlan?: { name: string; objective: string | null; workouts: WorkoutInput[] };
  planId?: string;
  muscleMap?: MuscleMap; // grupos musculares de cada exercício (para o resumo de volume)
  secondaryWeight?: number;
}) {
  const [name, setName] = useState(initialPlan?.name ?? "");
  const [objective, setObjective] = useState(initialPlan?.objective ?? "");
  const [workouts, setWorkouts] = useState<Workout[]>(
    initialPlan?.workouts.map((w) => ({ ...w, key: newKey(), exercises: w.exercises.map((ex) => ({ ...ex, uid: newKey() })) })) ?? [
      emptyWorkout(0),
    ],
  );
  const [activeKey, setActiveKey] = useState(workouts[0]?.key);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [clientError, setClientError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const [publishState, publishFormAction, publishPending] = useActionState(action.bind(null, "ativo"), {} as PlanFormState);
  const [draftState, draftFormAction, draftPending] = useActionState(action.bind(null, "rascunho"), {} as PlanFormState);
  const pending = publishPending || draftPending;
  const state = publishState.error ? publishState : draftState;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const active = workouts.find((w) => w.key === activeKey) ?? workouts[0];

  function buildPayload() {
    return JSON.stringify({
      name,
      objective: objective.trim() || null,
      workouts: workouts.map(({ key: _k, exercises: exs, ...w }) => ({ ...w, exercises: exs.map(({ uid: _u, ...ex }) => ex) })),
    });
  }

  function validateClient() {
    const parsed = planSchema.safeParse(JSON.parse(buildPayload()));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      // Se o erro é de um treino específico, abre a aba dele para a pessoa ver.
      const wi = issue?.path[0] === "workouts" ? Number(issue.path[1]) : NaN;
      if (Number.isInteger(wi) && workouts[wi]) setActiveKey(workouts[wi].key);
      setClientError(`${Number.isInteger(wi) && workouts[wi] ? `${workouts[wi].name}: ` : ""}${issue?.message ?? "Confira os campos da ficha."}`);
      return false;
    }
    setClientError(null);
    return true;
  }

  const volumeInputs = (w: Workout): VolumeInput[] =>
    w.exercises.filter((ex) => Number.isFinite(ex.sets) && ex.sets > 0).map((ex) => plannedInput(ex, w.key));

  const updateActive = (fn: (w: Workout) => Workout) => setWorkouts((prev) => prev.map((w) => (w.key === active.key ? fn(w) : w)));

  function addWorkout() {
    const w = emptyWorkout(workouts.length);
    setWorkouts((prev) => [...prev, w]);
    setActiveKey(w.key);
  }
  function removeWorkout() {
    if (!confirm(`Remover "${active.name}" e todos os exercícios dele?`)) return;
    const idx = workouts.findIndex((w) => w.key === active.key);
    const rest = workouts.filter((w) => w.key !== active.key);
    setWorkouts(rest);
    setActiveKey(rest[Math.max(0, idx - 1)]?.key);
  }
  function addExercise(exercise: ExerciseOption) {
    const ex = emptyExercise(exercise.id);
    updateActive((w) => ({ ...w, exercises: [...w.exercises, ex] }));
    setOpenIds((s) => new Set(s).add(ex.uid));
  }
  function patchExercise(uidToPatch: string, patch: Partial<ExerciseItemInput>) {
    updateActive((w) => ({ ...w, exercises: w.exercises.map((ex) => (ex.uid === uidToPatch ? { ...ex, ...patch } : ex)) }));
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= active.exercises.length) return;
    updateActive((w) => ({ ...w, exercises: arrayMove(w.exercises, from, to) }));
    const exName = exerciseIndex[active.exercises[from].exercise_id]?.name ?? "Exercício";
    setAnnounce(`${exName} agora é o ${to + 1}º de ${active.exercises.length}.`);
  }
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = active.exercises.findIndex((x) => x.uid === e.active.id);
    const to = active.exercises.findIndex((x) => x.uid === e.over!.id);
    move(from, to);
  }

  const submit = (formAction: (fd: FormData) => void) => (fd: FormData) => {
    if (!validateClient()) return;
    fd.set("payload", buildPayload());
    formAction(fd);
  };

  return (
    <div className="space-y-5 pb-28">
      <Link href={`/personal/alunos/${studentId}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> {studentName}
      </Link>

      {/* Dados da ficha */}
      <div className={`${cardCls} grid gap-4 p-4 sm:grid-cols-2 sm:p-5`}>
        <label className="space-y-1.5">
          <span className={labelCls}>Nome da ficha</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Hipertrofia ABC" className={inputCls} />
        </label>
        <label className="space-y-1.5">
          <span className={labelCls}>Objetivo (opcional)</span>
          <input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ex.: ganho de massa muscular" className={inputCls} />
        </label>
      </div>

      {/* Abas dos treinos A / B / C... */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Treinos da ficha">
        {workouts.map((w) => {
          const on = w.key === active?.key;
          return (
            <button
              key={w.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActiveKey(w.key)}
              className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                on ? "border-brand bg-brand text-brand-contrast" : "border-line bg-card text-soft hover:border-line-strong hover:text-ink"
              }`}
            >
              {w.name || "Sem nome"}
              <span className={`ml-2 text-xs font-medium ${on ? "opacity-80" : "text-muted"}`}>{w.exercises.length}</span>
            </button>
          );
        })}
        <button type="button" onClick={addWorkout} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-line-strong px-4 py-2 text-sm font-medium text-soft hover:border-brand hover:text-brand-ink">
          <Plus aria-hidden className="size-4" /> Treino
        </button>
      </div>

      {active && (
        <div role="tabpanel" aria-label={active.name} className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <span className="sr-only">Nome do treino</span>
                <input value={active.name} onChange={(e) => updateActive((w) => ({ ...w, name: e.target.value }))} className={`${inputCls} font-semibold`} />
              </label>
              {workouts.length > 1 && (
                <button type="button" onClick={removeWorkout} aria-label={`Remover ${active.name}`} title="Remover treino" className="grid size-12 shrink-0 place-items-center rounded-xl border border-line text-red-600 hover:bg-red-500/10 dark:text-red-400">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              )}
            </div>

            {active.exercises.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
                Nenhum exercício ainda. Busque abaixo e toque em “Adicionar”.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted">Arraste pela alça ⠿ (ou use ↑ ↓) para mudar a ordem. Toque no exercício para editar.</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={active.exercises.map((x) => x.uid)} strategy={verticalListSortingStrategy}>
                    <ol className="space-y-2">
                      {active.exercises.map((ex, i) => (
                        <ExerciseCard
                          key={ex.uid}
                          item={ex}
                          index={i}
                          total={active.exercises.length}
                          info={exerciseIndex[ex.exercise_id]}
                          open={openIds.has(ex.uid)}
                          onToggle={() =>
                            setOpenIds((s) => {
                              const n = new Set(s);
                              if (n.has(ex.uid)) n.delete(ex.uid);
                              else n.add(ex.uid);
                              return n;
                            })
                          }
                          onChange={(patch) => patchExercise(ex.uid, patch)}
                          onRemove={() => updateActive((w) => ({ ...w, exercises: w.exercises.filter((x) => x.uid !== ex.uid) }))}
                          onMove={(dir) => move(i, i + dir)}
                        />
                      ))}
                    </ol>
                  </SortableContext>
                </DndContext>
              </>
            )}
            <p className="sr-only" aria-live="polite">
              {announce}
            </p>

            <div className={`${cardCls} p-4`}>
              <p className="mb-3 text-sm font-semibold">Adicionar exercício ao {active.name || "treino"}</p>
              <ExercisePicker exercises={exercises} onAdd={addExercise} />
            </div>
          </div>

          <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
            <VolumeSummary title={`Resumo do ${active.name || "treino"}`} inputs={volumeInputs(active)} map={muscleMap} secondaryWeight={secondaryWeight} />
            {workouts.length > 1 && (
              <VolumeSummary title="Resumo da ficha (cada treino 1 vez)" inputs={workouts.flatMap(volumeInputs)} map={muscleMap} secondaryWeight={secondaryWeight} />
            )}
          </aside>
        </div>
      )}

      {(clientError || state.error) && (
        <p role="alert" className={errorCls}>
          {clientError ?? state.error}
        </p>
      )}

      {/* Barra de ações fixa */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p className="hidden flex-1 text-xs text-muted sm:block">Publicar encerra a ficha ativa anterior do aluno e avisa ele.</p>
          <form action={submit(draftFormAction)}>
            <button type="submit" disabled={pending} className={`${btnSecondaryCls} w-full sm:w-auto`}>
              {draftPending ? (
                <>
                  <Spinner /> Salvando...
                </>
              ) : (
                "Salvar rascunho"
              )}
            </button>
          </form>
          <form action={submit(publishFormAction)}>
            <button type="submit" disabled={pending} className={`${btnPrimaryCls} !h-11 sm:!w-auto sm:px-6`}>
              {publishPending ? (
                <>
                  <Spinner /> Publicando...
                </>
              ) : planId ? (
                "Salvar e publicar"
              ) : (
                "Publicar ficha"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
