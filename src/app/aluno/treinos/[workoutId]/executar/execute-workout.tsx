"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ExerciseVideo from "@/components/exercise-video";
import RestTimer from "@/components/rest-timer";
import { btnPrimaryCls, btnSecondaryCls, inputCls } from "@/lib/ui";
import { repsLabel, techniqueExplanation, type Technique } from "@/lib/workout-labels";
import { finishSession, logSet, startSession } from "./actions";

export type ExecExercise = {
  workout_exercise_id: string;
  exercise_id: string;
  name: string;
  instructions: string | null;
  video_url: string | null;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  reps_text: string | null;
  target_load_kg: number | null;
  rest_seconds: number | null;
  technique: Technique;
  technique_detail: string | null;
  notes: string | null;
};

type SetState = { reps: string; load: string; done: boolean };

function loadClientUuid(workoutId: string) {
  const key = `workout-session:${workoutId}`;
  if (typeof window === "undefined") return crypto.randomUUID();
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export default function ExecuteWorkout({
  workoutId,
  workoutName,
  exercises,
}: {
  workoutId: string;
  workoutName: string;
  exercises: ExecExercise[];
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restKey, setRestKey] = useState(0);

  const [setsByExercise, setSetsByExercise] = useState<Record<string, SetState[]>>(() =>
    Object.fromEntries(
      exercises.map((ex) => [
        ex.workout_exercise_id,
        Array.from({ length: ex.sets }, () => ({
          reps: ex.reps_min ? String(ex.reps_min) : "",
          load: ex.target_load_kg ? String(ex.target_load_kg) : "",
          done: false,
        })),
      ]),
    ),
  );

  useEffect(() => {
    const clientUuid = loadClientUuid(workoutId);
    startSession(workoutId, clientUuid).then((res) => {
      if (res.error) setError(res.error);
      else if (res.sessionId) setSessionId(res.sessionId);
    });
  }, [workoutId]);

  const exercise = exercises[current];
  const sets = setsByExercise[exercise.workout_exercise_id];
  const allDoneHere = sets.every((s) => s.done);
  const explanation = techniqueExplanation(exercise.technique, exercise.technique_detail);

  const totalSets = useMemo(
    () => exercises.reduce((acc, e) => acc + e.sets, 0),
    [exercises],
  );
  const doneSets = useMemo(
    () => Object.values(setsByExercise).reduce((acc, arr) => acc + arr.filter((s) => s.done).length, 0),
    [setsByExercise],
  );

  function updateSet(index: number, patch: Partial<SetState>) {
    setSetsByExercise((prev) => ({
      ...prev,
      [exercise.workout_exercise_id]: prev[exercise.workout_exercise_id].map((s, i) =>
        i === index ? { ...s, ...patch } : s,
      ),
    }));
  }

  async function completeSet(index: number) {
    if (!sessionId) return;
    const s = sets[index];
    updateSet(index, { done: true });

    await logSet({
      session_id: sessionId,
      workout_exercise_id: exercise.workout_exercise_id,
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.name,
      set_number: index + 1,
      reps_done: s.reps === "" ? null : Number(s.reps),
      load_kg: s.load === "" ? null : Number(s.load),
    });

    if (exercise.rest_seconds && exercise.rest_seconds > 0) {
      setRestSeconds(exercise.rest_seconds);
      setRestKey((k) => k + 1);
    }
  }

  function goNext() {
    if (current < exercises.length - 1) setCurrent((c) => c + 1);
  }
  function goPrev() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  const isLast = current === exercises.length - 1;

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center justify-between">
        <Link href={`/aluno/treinos/${workoutId}`} className="text-sm text-zinc-500 underline">
          ← Sair do treino
        </Link>
        <p className="text-sm text-zinc-500">
          {doneSets} de {totalSets} séries
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {workoutName} · Exercício {current + 1} de {exercises.length}
        </p>
        <h1 className="text-xl font-bold">{exercise.name}</h1>
      </div>

      {exercise.video_url && <ExerciseVideo url={exercise.video_url} />}

      {exercise.instructions && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{exercise.instructions}</p>
      )}

      {explanation && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {explanation}
        </p>
      )}

      <p className="text-sm text-zinc-500">
        Meta: {repsLabel(exercise.reps_min, exercise.reps_max, exercise.reps_text)} repetições
        {exercise.target_load_kg ? ` · ${exercise.target_load_kg} kg` : ""}
      </p>

      <div className="space-y-2">
        {sets.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-lg border p-2 ${
              s.done
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <span className="w-14 shrink-0 text-sm font-medium">Série {i + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="reps"
              value={s.reps}
              disabled={s.done}
              onChange={(e) => updateSet(i, { reps: e.target.value })}
              className={`${inputCls} !h-10 w-20`}
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="kg"
              value={s.load}
              disabled={s.done}
              onChange={(e) => updateSet(i, { load: e.target.value })}
              className={`${inputCls} !h-10 w-20`}
            />
            <button
              type="button"
              disabled={s.done || !sessionId}
              onClick={() => completeSet(i)}
              className="ml-auto shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {s.done ? "Feita ✓" : "Concluir série"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={goPrev} disabled={current === 0} className={`${btnSecondaryCls} flex-1`}>
          ← Anterior
        </button>
        {isLast ? (
          <form action={finishSession} className="flex-1">
            <input type="hidden" name="session_id" value={sessionId ?? ""} />
            <button type="submit" disabled={!sessionId || !allDoneHere} className={`${btnPrimaryCls} disabled:opacity-50`}>
              Finalizar treino
            </button>
          </form>
        ) : (
          <button type="button" onClick={goNext} className={`${btnPrimaryCls} flex-1`}>
            Próximo exercício →
          </button>
        )}
      </div>

      {restSeconds !== null && (
        <RestTimer key={restKey} seconds={restSeconds} onClose={() => setRestSeconds(null)} />
      )}
    </div>
  );
}
