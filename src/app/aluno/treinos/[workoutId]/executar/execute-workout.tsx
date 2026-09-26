"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExerciseVideo from "@/components/exercise-video";
import RestTimer from "@/components/rest-timer";
import { btnPrimaryCls, btnSecondaryCls, inputCls } from "@/lib/ui";
import { repsLabel, techniqueExplanation, type Technique } from "@/lib/workout-labels";
import { finishSession, logSet, resumeSession, startSession, type LoggedSet } from "./actions";

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

type SetState = { reps: string; load: string; done: boolean; saving: boolean; error: string | null };

// O navegador guarda o identificador da sessão EM ANDAMENTO de cada treino, para retomar se a
// página recarregar. Ele é apagado no check-out, então o próximo treino gera uma sessão nova.
const storageKey = (workoutId: string) => `workout-session:${workoutId}`;

function readStored(workoutId: string) {
  try {
    return window.localStorage.getItem(storageKey(workoutId));
  } catch {
    return null;
  }
}
function writeStored(workoutId: string, value: string | null) {
  try {
    if (value) window.localStorage.setItem(storageKey(workoutId), value);
    else window.localStorage.removeItem(storageKey(workoutId));
  } catch {
    // navegador sem armazenamento (ex.: aba anônima restrita): só não dá para retomar
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
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
  const router = useRouter();
  const [phase, setPhase] = useState<"carregando" | "checkin" | "treino">("carregando");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
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
          saving: false,
          error: null,
        })),
      ]),
    ),
  );

  // Marca como feitas as séries que já estavam gravadas no banco (ao retomar um treino).
  function applyLoggedSets(logged: LoggedSet[]) {
    setSetsByExercise((prev) => {
      const next = { ...prev };
      for (const l of logged) {
        const arr = next[l.workout_exercise_id];
        if (!arr || !arr[l.set_number - 1]) continue;
        next[l.workout_exercise_id] = arr.map((st, i) =>
          i === l.set_number - 1
            ? {
                ...st,
                done: true,
                reps: l.reps_done === null ? st.reps : String(l.reps_done),
                load: l.load_kg === null ? st.load : String(l.load_kg),
              }
            : st,
        );
      }
      return next;
    });
  }

  // Ao abrir: se há um treino em andamento neste navegador, retoma; senão, mostra o check-in.
  useEffect(() => {
    const stored = readStored(workoutId);
    (stored ? resumeSession(stored) : Promise.resolve({} as Awaited<ReturnType<typeof resumeSession>>))
      .then((res) => {
        if (res.error) {
          setSessionError(res.error);
          setPhase("checkin");
        } else if (res.sessionId) {
          setSessionId(res.sessionId);
          setStartedAt(res.startedAt ?? null);
          applyLoggedSets(res.sets ?? []);
          setPhase("treino");
        } else {
          if (stored) writeStored(workoutId, null); // sessão antiga já finalizada: não reaproveita
          setPhase("checkin");
        }
      })
      .catch((err) => {
        console.error("resumeSession falhou:", err);
        setSessionError("Falha de conexão. Verifique sua internet e recarregue a página.");
        setPhase("checkin");
      });
  }, [workoutId]);

  // CHECK-IN: registra data e horário de entrada.
  async function handleCheckin() {
    setSessionError(null);
    setCheckingIn(true);
    // Reaproveita o identificador se a tentativa anterior falhou: assim não duplica a sessão.
    const clientUuid = readStored(workoutId) ?? crypto.randomUUID();
    writeStored(workoutId, clientUuid);
    try {
      const res = await startSession(workoutId, clientUuid);
      if (res.error || !res.sessionId) {
        setSessionError(res.error ?? "Não foi possível fazer o check-in.");
        if (res.error?.includes("já foi finalizado")) writeStored(workoutId, null);
        return;
      }
      setSessionId(res.sessionId);
      setStartedAt(res.startedAt ?? null);
      setPhase("treino");
    } catch (err) {
      console.error("startSession falhou:", err);
      setSessionError("Falha de conexão ao fazer o check-in. Tente novamente.");
    } finally {
      setCheckingIn(false);
    }
  }

  const exercise = exercises[current];
  const sets = setsByExercise[exercise.workout_exercise_id];
  const explanation = techniqueExplanation(exercise.technique, exercise.technique_detail);

  const totalSets = useMemo(() => exercises.reduce((acc, e) => acc + e.sets, 0), [exercises]);
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

  // IMPORTANTE: só marca a série como concluída DEPOIS de confirmar que foi salva no banco.
  // Se falhar, mostra o erro exato na tela em vez de fingir que deu certo.
  async function completeSet(index: number) {
    if (!sessionId) {
      updateSet(index, { error: "O treino ainda não terminou de iniciar. Aguarde um instante e tente de novo." });
      return;
    }
    const s = sets[index];
    updateSet(index, { saving: true, error: null });

    try {
      const res = await logSet({
        session_id: sessionId,
        workout_exercise_id: exercise.workout_exercise_id,
        exercise_id: exercise.exercise_id,
        exercise_name: exercise.name,
        set_number: index + 1,
        reps_done: s.reps === "" ? null : Number(s.reps),
        load_kg: s.load === "" ? null : Number(s.load),
      });

      if (res.error) {
        updateSet(index, { saving: false, error: res.error });
        return;
      }

      updateSet(index, { done: true, saving: false, error: null });

      if (exercise.rest_seconds && exercise.rest_seconds > 0) {
        setRestSeconds(exercise.rest_seconds);
        setRestKey((k) => k + 1);
      }
    } catch (err) {
      console.error("logSet falhou:", err);
      updateSet(index, { saving: false, error: "Falha de conexão ao salvar a série. Tente novamente." });
    }
  }

  function goNext() {
    if (current < exercises.length - 1) setCurrent((c) => c + 1);
  }
  function goPrev() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  const isLast = current === exercises.length - 1;

  // CHECK-OUT: registra o horário de saída. Só sai da tela depois que o banco confirmar.
  async function handleFinish() {
    if (!sessionId) return;
    if (
      doneSets < totalSets &&
      !confirm(`Você concluiu ${doneSets} de ${totalSets} séries. Fazer o check-out e finalizar o treino mesmo assim?`)
    ) {
      return;
    }
    setFinishError(null);
    setFinishing(true);
    try {
      const res = await finishSession(sessionId);
      if (res.error) {
        setFinishError(res.error);
        setFinishing(false);
        return;
      }
      writeStored(workoutId, null);
      router.push("/aluno/treinos/historico?concluido=1");
    } catch (err) {
      console.error("finishSession falhou:", err);
      setFinishError("Falha de conexão ao fazer o check-out. Tente novamente.");
      setFinishing(false);
    }
  }

  if (phase !== "treino") {
    return (
      <div className="space-y-4">
        <Link href={`/aluno/treinos/${workoutId}`} className="text-sm text-muted underline">
          ← Voltar
        </Link>
        <div className="space-y-1 rounded-xl border border-line p-5 text-center bg-card">
          <p className="text-xs uppercase tracking-wide text-muted">Treino de hoje</p>
          <h1 className="text-2xl font-bold">{workoutName}</h1>
          <p className="text-sm text-muted">
            {exercises.length} {exercises.length === 1 ? "exercício" : "exercícios"} · {totalSets} séries
          </p>
        </div>
        {sessionError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {sessionError}
          </p>
        )}
        {phase === "carregando" ? (
          <p className="text-center text-sm text-muted">Carregando...</p>
        ) : (
          <>
            <button type="button" onClick={handleCheckin} disabled={checkingIn} className={btnPrimaryCls}>
              {checkingIn ? "Registrando..." : "Fazer check-in"}
            </button>
            <p className="text-center text-xs text-muted">
              O check-in registra o horário de entrada. No fim, faça o check-out para registrar a saída.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center justify-between">
        <Link href={`/aluno/treinos/${workoutId}`} className="text-sm text-muted underline">
          ← Sair do treino
        </Link>
        <p className="text-right text-sm text-muted">
          {startedAt && <span className="block text-xs">Check-in às {formatTime(startedAt)}</span>}
          {doneSets} de {totalSets} séries
        </p>
      </div>

      {sessionError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {sessionError}
        </p>
      )}
      {finishError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {finishError}
        </p>
      )}

      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {workoutName} · Exercício {current + 1} de {exercises.length}
        </p>
        <h1 className="text-xl font-bold">{exercise.name}</h1>
      </div>

      {exercise.video_url && <ExerciseVideo url={exercise.video_url} />}

      {exercise.instructions && (
        <p className="text-sm text-soft">{exercise.instructions}</p>
      )}

      {explanation && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {explanation}
        </p>
      )}

      <p className="text-sm text-muted">
        Meta: {repsLabel(exercise.reps_min, exercise.reps_max, exercise.reps_text)} repetições
        {exercise.target_load_kg ? ` · ${exercise.target_load_kg} kg` : ""}
      </p>

      <div className="space-y-2">
        {sets.map((s, i) => (
          <div key={i} className="space-y-1">
            <div
              className={`flex items-center gap-2 rounded-lg border p-2 ${
                s.done
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : "border-line"
              }`}
            >
              <span className="w-14 shrink-0 text-sm font-medium">Série {i + 1}</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="reps"
                value={s.reps}
                disabled={s.done || s.saving}
                onChange={(e) => updateSet(i, { reps: e.target.value })}
                className={`${inputCls} !h-10 w-20`}
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="kg"
                value={s.load}
                disabled={s.done || s.saving}
                onChange={(e) => updateSet(i, { load: e.target.value })}
                className={`${inputCls} !h-10 w-20`}
              />
              <button
                type="button"
                disabled={s.done || s.saving || !sessionId}
                onClick={() => completeSet(i)}
                className="ml-auto shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-contrast disabled:opacity-50"
              >
                {s.done ? "Feita ✓" : s.saving ? "Salvando..." : "Concluir série"}
              </button>
            </div>
            {s.error && (
              <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {s.error}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={goPrev} disabled={current === 0} className={`${btnSecondaryCls} flex-1`}>
          ← Anterior
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!sessionId || finishing}
            className={`${btnPrimaryCls} flex-1 disabled:opacity-50`}
          >
            {finishing ? "Finalizando..." : "Finalizar treino / Check-out"}
          </button>
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
