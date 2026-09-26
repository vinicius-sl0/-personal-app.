"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExerciseVideo from "@/components/exercise-video";
import RestTimer from "@/components/rest-timer";
import { ArrowLeft, Check, CheckCircle2, ChevronLeft, ChevronRight, Loader2, LogIn, LogOut } from "lucide-react";
import { btnPrimaryCls, btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";
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
  const [completedEx, setCompletedEx] = useState<Set<number>>(new Set());
  const [celebrate, setCelebrate] = useState<number | null>(null);

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

  // "Concluir exercício": marca o exercício como feito e segue para o próximo pendente.
  const exerciseDone = (i: number) =>
    completedEx.has(i) || (setsByExercise[exercises[i].workout_exercise_id]?.every((s) => s.done) ?? false);
  const allExercisesDone = exercises.every((_, i) => exerciseDone(i));
  const currentDone = exerciseDone(current);
  const doneHere = sets.filter((s) => s.done).length;

  function completeExercise() {
    if (doneHere < sets.length && !confirm(`Você concluiu ${doneHere} de ${sets.length} séries deste exercício. Concluir mesmo assim?`)) {
      return;
    }
    setCompletedEx((prev) => new Set(prev).add(current));
    setCelebrate(current);
    setTimeout(() => setCelebrate(null), 900);
    const nextPending = exercises.findIndex((_, i) => i > current && !exerciseDone(i));
    if (nextPending !== -1) setTimeout(() => setCurrent(nextPending), 450);
  }

  if (phase !== "treino") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href={`/aluno/treinos/${workoutId}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> Voltar
        </Link>
        <section className="theme-dark relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand/25 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink">Treino de hoje</p>
          <h1 className="relative mt-2 text-3xl font-bold">{workoutName}</h1>
          <p className="relative mt-1 text-sm text-soft">
            {exercises.length} {exercises.length === 1 ? "exercício" : "exercícios"} · {totalSets} séries
          </p>
          <ol className="relative mt-5 space-y-1.5 text-sm">
            {exercises.slice(0, 6).map((ex, i) => (
              <li key={ex.workout_exercise_id} className="flex items-center gap-3 text-soft">
                <span className="grid size-6 place-items-center rounded-md bg-subtle-strong text-[11px] font-bold">{i + 1}</span>
                <span className="truncate">{ex.name}</span>
              </li>
            ))}
            {exercises.length > 6 && <li className="pl-9 text-xs text-muted">+ {exercises.length - 6} exercício(s)</li>}
          </ol>
        </section>
        {sessionError && (
          <p role="alert" className={errorCls}>
            {sessionError}
          </p>
        )}
        {phase === "carregando" ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Carregando...
          </p>
        ) : (
          <>
            <button type="button" onClick={handleCheckin} disabled={checkingIn} className={`${btnPrimaryCls} !h-14 text-lg`}>
              {checkingIn ? (
                <>
                  <Loader2 aria-hidden className="size-5 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <LogIn aria-hidden className="size-5" /> Fazer check-in
                </>
              )}
            </button>
            <p className="text-center text-xs text-muted">
              O check-in registra o horário de entrada. No fim, faça o check-out para registrar a saída.
            </p>
          </>
        )}
      </div>
    );
  }

  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-32">
      {/* Topo: sair, horário do check-in e progresso geral */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/aluno/treinos/${workoutId}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft aria-hidden className="size-4" /> Sair
          </Link>
          <p className="text-right text-xs text-muted">
            {startedAt && <>Check-in às {formatTime(startedAt)} · </>}
            <span className="font-medium text-ink">
              {doneSets}/{totalSets} séries
            </span>
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-subtle-strong" role="progressbar" aria-label="Progresso do treino" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        {/* Trilha de exercícios */}
        <ol className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Exercícios do treino">
          {exercises.map((ex, i) => {
            const done = exerciseDone(i);
            const on = i === current;
            return (
              <li key={ex.workout_exercise_id}>
                <button
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-current={on ? "step" : undefined}
                  aria-label={`Exercício ${i + 1}: ${ex.name}${done ? " (concluído)" : ""}`}
                  className={`grid size-9 place-items-center rounded-xl text-xs font-bold transition ${
                    on
                      ? "bg-brand text-brand-contrast"
                      : done
                        ? "bg-emerald-600 text-white"
                        : "border border-line bg-card text-soft hover:border-line-strong"
                  }`}
                >
                  {done && !on ? <Check aria-hidden className="size-4" /> : i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {sessionError && <p className={errorCls}>{sessionError}</p>}
      {finishError && (
        <p role="alert" className={errorCls}>
          {finishError}
        </p>
      )}

      {/* Exercício atual */}
      <section key={exercise.workout_exercise_id} className="animate-slide-up space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-ink">
              Exercício {current + 1} de {exercises.length} · {workoutName}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{exercise.name}</h1>
          </div>
          {celebrate === current && (
            <span aria-hidden className="grid size-11 shrink-0 animate-pop place-items-center rounded-full bg-emerald-600 text-white">
              <Check className="size-6" />
            </span>
          )}
        </div>

        <ul className="flex flex-wrap gap-2 text-sm" aria-label="Meta do exercício">
          <li className="rounded-xl border border-line bg-card px-3 py-1.5">
            <span className="text-muted">Séries </span>
            <strong>{exercise.sets}</strong>
          </li>
          <li className="rounded-xl border border-line bg-card px-3 py-1.5">
            <span className="text-muted">Reps </span>
            <strong>{repsLabel(exercise.reps_min, exercise.reps_max, exercise.reps_text)}</strong>
          </li>
          {exercise.target_load_kg ? (
            <li className="rounded-xl border border-line bg-card px-3 py-1.5">
              <span className="text-muted">Carga </span>
              <strong>{exercise.target_load_kg} kg</strong>
            </li>
          ) : null}
          {exercise.rest_seconds ? (
            <li className="rounded-xl border border-line bg-card px-3 py-1.5">
              <span className="text-muted">Descanso </span>
              <strong>{exercise.rest_seconds}s</strong>
            </li>
          ) : null}
        </ul>

        {exercise.video_url && (
          <div className="overflow-hidden rounded-2xl border border-line">
            <ExerciseVideo url={exercise.video_url} />
          </div>
        )}

        {explanation && (
          <p className="rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm">
            <strong className="text-brand-ink">Técnica:</strong> {explanation}
          </p>
        )}
        {exercise.notes && (
          <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
            <strong>Observação do Personal:</strong> {exercise.notes}
          </p>
        )}
        {exercise.instructions && (
          <details className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">Como executar</summary>
            <p className="mt-2 whitespace-pre-line text-soft">{exercise.instructions}</p>
          </details>
        )}

        {/* Séries */}
        <div className="space-y-2">
          <div className="grid grid-cols-[2.25rem_1fr_1fr_auto] items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            <span>Série</span>
            <span>Reps</span>
            <span>Carga (kg)</span>
            <span className="sr-only">Ação</span>
          </div>
          {sets.map((s, i) => (
            <div key={i} className="space-y-1">
              <div
                className={`grid grid-cols-[2.25rem_1fr_1fr_auto] items-center gap-2 rounded-2xl border p-2 transition ${
                  s.done ? "border-emerald-500/40 bg-emerald-500/10" : "border-line bg-card"
                }`}
              >
                <span className={`grid size-9 place-items-center rounded-xl text-sm font-bold ${s.done ? "bg-emerald-600 text-white" : "bg-subtle-strong text-soft"}`}>
                  {s.done ? <Check aria-hidden className="size-4" /> : i + 1}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label={`Repetições da série ${i + 1}`}
                  placeholder="reps"
                  value={s.reps}
                  disabled={s.done || s.saving}
                  onChange={(e) => updateSet(i, { reps: e.target.value })}
                  className={`${inputCls} !h-11 text-center`}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label={`Carga da série ${i + 1} em kg`}
                  placeholder="kg"
                  value={s.load}
                  disabled={s.done || s.saving}
                  onChange={(e) => updateSet(i, { load: e.target.value })}
                  className={`${inputCls} !h-11 text-center`}
                />
                <button
                  type="button"
                  disabled={s.done || s.saving || !sessionId}
                  onClick={() => completeSet(i)}
                  className={`inline-flex h-11 min-w-24 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition active:scale-95 disabled:cursor-default ${
                    s.done ? "text-emerald-700 dark:text-emerald-400" : "bg-brand text-brand-contrast hover:bg-brand-hover disabled:opacity-50"
                  }`}
                >
                  {s.done ? (
                    <>
                      <Check aria-hidden className="size-4" /> Feita
                    </>
                  ) : s.saving ? (
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                  ) : (
                    "Concluir"
                  )}
                </button>
              </div>
              {s.error && (
                <p role="alert" className={`${errorCls} !py-1.5 text-xs`}>
                  {s.error}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Barra fixa de ações */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button type="button" onClick={goPrev} disabled={current === 0} aria-label="Exercício anterior" className={`${btnSecondaryCls} !h-12 w-14 shrink-0 px-0`}>
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          {!currentDone ? (
            <button type="button" onClick={completeExercise} className={`${btnPrimaryCls} flex-1`}>
              <CheckCircle2 aria-hidden className="size-5" /> Concluir exercício
            </button>
          ) : !isLast && !allExercisesDone ? (
            <button type="button" onClick={goNext} className={`${btnPrimaryCls} flex-1`}>
              Próximo exercício <ChevronRight aria-hidden className="size-5" />
            </button>
          ) : (
            <button type="button" onClick={handleFinish} disabled={!sessionId || finishing} className={`${btnPrimaryCls} flex-1`}>
              {finishing ? (
                <>
                  <Loader2 aria-hidden className="size-5 animate-spin" /> Finalizando...
                </>
              ) : (
                <>
                  <LogOut aria-hidden className="size-5" /> Finalizar treino / Check-out
                </>
              )}
            </button>
          )}
          {!isLast && !(currentDone && allExercisesDone) && (
            <button type="button" onClick={goNext} aria-label="Próximo exercício" className={`${btnSecondaryCls} !h-12 w-14 shrink-0 px-0`}>
              <ChevronRight aria-hidden className="size-5" />
            </button>
          )}
        </div>
        {!allExercisesDone && (
          <div className="mx-auto mt-1.5 max-w-2xl text-center">
            <button type="button" onClick={handleFinish} disabled={!sessionId || finishing} className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">
              Encerrar o treino agora (check-out)
            </button>
          </div>
        )}
      </div>

      {restSeconds !== null && <RestTimer key={restKey} seconds={restSeconds} onClose={() => setRestSeconds(null)} />}
    </div>
  );
}
