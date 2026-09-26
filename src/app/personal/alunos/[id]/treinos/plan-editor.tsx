"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import ExercisePicker, { type ExerciseOption } from "@/components/exercise-picker";
import VolumeSummary from "@/components/volume-summary";
import { plannedInput, type MuscleMap, type VolumeInput } from "@/lib/volume";
import { btnPrimaryCls, btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";
import {
  repsLabel,
  TECHNIQUE_DETAIL_FIELD,
  TECHNIQUE_LABEL,
  techniqueExplanation,
  type Technique,
} from "@/lib/workout-labels";
import type { PlanFormState } from "./actions";
import { planSchema, type ExerciseItemInput, type WorkoutInput } from "./schema";

type Workout = WorkoutInput & { key: string };

let uid = 0;
const newKey = () => `w${Date.now()}_${uid++}`;

function emptyExercise(exercise_id: string): ExerciseItemInput {
  return {
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
  initialPlan?: { name: string; objective: string | null; workouts: Omit<Workout, "key">[] };
  planId?: string;
  muscleMap?: MuscleMap; // grupos musculares de cada exercício (para o resumo de volume)
  secondaryWeight?: number;
}) {
  const [name, setName] = useState(initialPlan?.name ?? "");
  const [objective, setObjective] = useState(initialPlan?.objective ?? "");
  const [workouts, setWorkouts] = useState<Workout[]>(
    initialPlan?.workouts.map((w) => ({ ...w, key: newKey() })) ?? [emptyWorkout(0)],
  );
  const [clientError, setClientError] = useState<string | null>(null);

  const publishAction = useActionState(action.bind(null, "ativo"), {} as PlanFormState);
  const draftAction = useActionState(action.bind(null, "rascunho"), {} as PlanFormState);
  const [publishState, publishFormAction, publishPending] = publishAction;
  const [draftState, draftFormAction, draftPending] = draftAction;
  const pending = publishPending || draftPending;
  const state = publishState.error ? publishState : draftState;

  function buildPayload() {
    return JSON.stringify({
      name,
      objective: objective.trim() || null,
      workouts: workouts.map(({ key: _key, ...w }) => w),
    });
  }

  function validateClient() {
    const parsed = planSchema.safeParse(JSON.parse(buildPayload()));
    if (!parsed.success) {
      setClientError(parsed.error.issues[0]?.message ?? "Confira os campos da ficha.");
      return false;
    }
    setClientError(null);
    return true;
  }

  // Entradas do resumo de volume, recalculadas a cada edição (séries ainda sendo digitadas são ignoradas).
  const volumeInputs = (w: Workout): VolumeInput[] =>
    w.exercises
      .filter((ex) => Number.isFinite(ex.sets) && ex.sets > 0)
      .map((ex) => plannedInput(ex, w.key));

  function addWorkout() {
    setWorkouts((prev) => [...prev, emptyWorkout(prev.length)]);
  }

  function removeWorkout(key: string) {
    setWorkouts((prev) => prev.filter((w) => w.key !== key));
  }

  function updateWorkout(key: string, patch: Partial<Workout>) {
    setWorkouts((prev) => prev.map((w) => (w.key === key ? { ...w, ...patch } : w)));
  }

  function addExercise(workoutKey: string, exercise: ExerciseOption) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.key === workoutKey ? { ...w, exercises: [...w.exercises, emptyExercise(exercise.id)] } : w,
      ),
    );
  }

  function updateExercise(workoutKey: string, index: number, patch: Partial<ExerciseItemInput>) {
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.key !== workoutKey) return w;
        const exercises = w.exercises.map((ex, i) => (i === index ? { ...ex, ...patch } : ex));
        return { ...w, exercises };
      }),
    );
  }

  function removeExercise(workoutKey: string, index: number) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.key === workoutKey ? { ...w, exercises: w.exercises.filter((_, i) => i !== index) } : w,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/personal/alunos/${studentId}`} className="text-sm text-zinc-500 underline">
          ← Voltar para {studentName}
        </Link>
      </div>

      <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nome da ficha</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Hipertrofia ABC"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Objetivo (opcional)</label>
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Ex.: ganho de massa muscular"
            className={inputCls}
          />
        </div>
      </div>

      {workouts.map((w, wi) => (
        <div key={w.key} className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <input
              value={w.name}
              onChange={(e) => updateWorkout(w.key, { name: e.target.value })}
              className={`${inputCls} !h-10 flex-1 font-semibold`}
            />
            {workouts.length > 1 && (
              <button
                type="button"
                onClick={() => removeWorkout(w.key)}
                className="shrink-0 rounded-lg border border-red-300 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
              >
                Remover treino
              </button>
            )}
          </div>

          <div className="space-y-3">
            {w.exercises.length === 0 && (
              <p className="text-sm text-zinc-500">Nenhum exercício adicionado ainda.</p>
            )}
            {w.exercises.map((ex, ei) => {
              const info = exerciseIndex[ex.exercise_id];
              const detailField = TECHNIQUE_DETAIL_FIELD[ex.technique];
              const explanation = techniqueExplanation(ex.technique, ex.technique_detail);
              return (
                <div key={ei} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{info?.name ?? "Exercício"}</p>
                    <button
                      type="button"
                      onClick={() => removeExercise(w.key, ei)}
                      className="shrink-0 text-xs text-red-700 underline dark:text-red-300"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label className="space-y-1 text-xs text-zinc-500">
                      Séries
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={ex.sets}
                        onChange={(e) => updateExercise(w.key, ei, { sets: Number(e.target.value) })}
                        className={`${inputCls} !h-10`}
                      />
                    </label>
                    <label className="space-y-1 text-xs text-zinc-500">
                      Reps. mín.
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={ex.reps_min ?? ""}
                        onChange={(e) =>
                          updateExercise(w.key, ei, {
                            reps_min: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className={`${inputCls} !h-10`}
                      />
                    </label>
                    <label className="space-y-1 text-xs text-zinc-500">
                      Reps. máx.
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={ex.reps_max ?? ""}
                        onChange={(e) =>
                          updateExercise(w.key, ei, {
                            reps_max: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className={`${inputCls} !h-10`}
                      />
                    </label>
                    <label className="space-y-1 text-xs text-zinc-500">
                      Descanso (s)
                      <input
                        type="number"
                        min={0}
                        max={3600}
                        value={ex.rest_seconds ?? ""}
                        onChange={(e) =>
                          updateExercise(w.key, ei, {
                            rest_seconds: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className={`${inputCls} !h-10`}
                      />
                    </label>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="space-y-1 text-xs text-zinc-500">
                      Reps. em texto (opcional, substitui mín./máx.)
                      <input
                        value={ex.reps_text ?? ""}
                        onChange={(e) =>
                          updateExercise(w.key, ei, { reps_text: e.target.value || null })
                        }
                        placeholder='Ex.: "até a falha"'
                        className={`${inputCls} !h-10`}
                      />
                    </label>
                    <label className="space-y-1 text-xs text-zinc-500">
                      Carga alvo (kg, opcional)
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={ex.target_load_kg ?? ""}
                        onChange={(e) =>
                          updateExercise(w.key, ei, {
                            target_load_kg: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className={`${inputCls} !h-10`}
                      />
                    </label>
                  </div>

                  <label className="mt-2 block space-y-1 text-xs text-zinc-500">
                    Técnica
                    <select
                      value={ex.technique}
                      onChange={(e) =>
                        updateExercise(w.key, ei, {
                          technique: e.target.value as Technique,
                          technique_detail: e.target.value === "normal" ? null : ex.technique_detail,
                        })
                      }
                      className={`${inputCls} !h-10`}
                    >
                      {(Object.keys(TECHNIQUE_LABEL) as Technique[]).map((t) => (
                        <option key={t} value={t}>
                          {TECHNIQUE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </label>

                  {detailField && (
                    <label className="mt-2 block space-y-1 text-xs text-zinc-500">
                      {detailField.label}
                      <input
                        value={ex.technique_detail ?? ""}
                        onChange={(e) =>
                          updateExercise(w.key, ei, { technique_detail: e.target.value || null })
                        }
                        placeholder={detailField.placeholder}
                        className={`${inputCls} !h-10`}
                      />
                    </label>
                  )}

                  <label className="mt-2 block space-y-1 text-xs text-zinc-500">
                    Observação (opcional)
                    <input
                      value={ex.notes ?? ""}
                      onChange={(e) => updateExercise(w.key, ei, { notes: e.target.value || null })}
                      placeholder="Ex.: cadência lenta na descida"
                      className={`${inputCls} !h-10`}
                    />
                  </label>

                  <p className="mt-2 text-xs text-zinc-500">
                    Prévia: {ex.sets}× {repsLabel(ex.reps_min, ex.reps_max, ex.reps_text)}
                    {ex.target_load_kg ? ` · ${ex.target_load_kg} kg` : ""}
                    {ex.rest_seconds ? ` · descanso ${ex.rest_seconds}s` : ""}
                  </p>
                  {explanation && (
                    <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      Como o aluno vai ver: {explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <ExercisePicker exercises={exercises} onAdd={(ex) => addExercise(w.key, ex)} />

          <VolumeSummary
            title={`Resumo do ${w.name || "treino"}`}
            inputs={volumeInputs(w)}
            map={muscleMap}
            secondaryWeight={secondaryWeight}
          />
        </div>
      ))}

      {workouts.length > 1 && (
        <VolumeSummary
          title="Resumo da ficha (todos os treinos, cada um 1 vez)"
          inputs={workouts.flatMap(volumeInputs)}
          map={muscleMap}
          secondaryWeight={secondaryWeight}
        />
      )}

      <button type="button" onClick={addWorkout} className={btnSecondaryCls}>
        + Adicionar treino (ex.: Treino B)
      </button>

      {(clientError || state.error) && (
        <p role="alert" className={errorCls}>
          {clientError ?? state.error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <form
          action={(fd) => {
            if (!validateClient()) return;
            fd.set("payload", buildPayload());
            draftFormAction(fd);
          }}
          className="flex-1"
        >
          <button type="submit" disabled={pending} className={btnSecondaryCls + " w-full"}>
            {draftPending ? "Salvando..." : "Salvar rascunho"}
          </button>
        </form>
        <form
          action={(fd) => {
            if (!validateClient()) return;
            fd.set("payload", buildPayload());
            publishFormAction(fd);
          }}
          className="flex-1"
        >
          <button type="submit" disabled={pending} className={btnPrimaryCls}>
            {publishPending ? "Publicando..." : planId ? "Salvar e publicar" : "Publicar ficha"}
          </button>
        </form>
      </div>
      <p className="text-xs text-zinc-500">
        Publicar encerra automaticamente a ficha ativa anterior do aluno e envia uma notificação a ele.
      </p>
    </div>
  );
}
