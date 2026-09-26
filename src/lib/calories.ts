// CALORIAS ESTIMADAS — cálculo puro (servidor e navegador). São APROXIMAÇÕES, não medições.
//
// Dados usados (todos registrados de verdade):
//   workout_sessions.started_at (check-in) e finished_at (check-out) → duração do treino
//   set_logs (séries concluídas)                                   → quanto de cada exercício foi feito
//   exercises.kcal_per_min                                         → gasto médio por minuto (Personal preenche)
//
// Regras:
//   • Tempo estimado de um exercício na sessão = duração do treino × (séries dele ÷ séries da sessão).
//     Assim o descanso entre séries entra junto, como acontece no treino real.
//   • Calorias estimadas = tempo estimado × kcal/min do exercício.
//   • Treino sem check-out não tem duração → fica fora (e é contado para aviso).
//   • Exercício sem kcal/min cadastrado → fica fora (e é contado para aviso). Nada é inventado.

import { localDate } from "@/lib/attendance";
import { weekStartOf } from "@/lib/feedback";

export type CalorieSession = {
  id: string;
  workout_name_snapshot: string;
  started_at: string;
  finished_at: string | null;
  status: string;
};
export type CalorieLog = { session_id: string; exercise_id: string | null; exercise_name: string };
export type ExerciseKcal = Record<string, number | null>; // exercise_id → kcal/min

export type SessionCalories = {
  id: string;
  name: string;
  date: string;
  durationMin: number | null; // null = sem check-out
  sets: number;
  kcal: number; // soma do que dá para estimar
  partial: boolean; // alguma série sem kcal/min cadastrado
};

export type ExerciseCalories = {
  key: string;
  name: string;
  sets: number;
  minutes: number; // só de treinos com check-out
  kcalPerMin: number | null;
  kcal: number | null; // null = sem kcal/min cadastrado
};

export type CalorieResult = {
  sessions: SessionCalories[];
  exercises: ExerciseCalories[];
  weeks: { weekStart: string; kcal: number; sessions: number }[];
  totals: {
    kcal: number;
    minutes: number;
    sessionsWithDuration: number;
    sessionsWithoutCheckout: number;
    setsWithoutKcal: number; // séries (em treinos com duração) de exercícios sem kcal/min
    longSessions: number; // treinos com mais de 3 h (talvez o check-out tenha sido esquecido)
  };
};

const LONG_SESSION_MIN = 180;

export function estimateCalories(sessions: CalorieSession[], logs: CalorieLog[], kcal: ExerciseKcal): CalorieResult {
  const logsBySession = new Map<string, CalorieLog[]>();
  for (const l of logs) logsBySession.set(l.session_id, [...(logsBySession.get(l.session_id) ?? []), l]);

  const byExercise = new Map<string, ExerciseCalories>();
  const byWeek = new Map<string, { kcal: number; sessions: number }>();
  const totals: CalorieResult["totals"] = {
    kcal: 0,
    minutes: 0,
    sessionsWithDuration: 0,
    sessionsWithoutCheckout: 0,
    setsWithoutKcal: 0,
    longSessions: 0,
  };

  const result: SessionCalories[] = [];
  for (const s of [...sessions].sort((a, b) => a.started_at.localeCompare(b.started_at))) {
    const sLogs = logsBySession.get(s.id) ?? [];
    const duration =
      s.status === "concluida" && s.finished_at
        ? (new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 60000
        : null;
    const hasDuration = duration !== null && duration > 0 && sLogs.length > 0;
    let sessionKcal = 0;
    let partial = false;

    // séries por exercício nesta sessão
    const counts = new Map<string, { name: string; id: string | null; sets: number }>();
    for (const l of sLogs) {
      const key = l.exercise_id ?? `nome:${l.exercise_name}`;
      const c = counts.get(key) ?? { name: l.exercise_name, id: l.exercise_id, sets: 0 };
      c.sets += 1;
      counts.set(key, c);
    }

    for (const [key, c] of counts) {
      const perMin = c.id ? (kcal[c.id] ?? null) : null;
      const ex = byExercise.get(key) ?? { key, name: c.name, sets: 0, minutes: 0, kcalPerMin: perMin, kcal: perMin === null ? null : 0 };
      ex.sets += c.sets;
      if (hasDuration) {
        const minutes = duration * (c.sets / sLogs.length);
        ex.minutes += minutes;
        if (perMin !== null) {
          const k = minutes * perMin;
          ex.kcal = (ex.kcal ?? 0) + k;
          sessionKcal += k;
        } else {
          partial = true;
          totals.setsWithoutKcal += c.sets;
        }
      }
      byExercise.set(key, ex);
    }

    if (duration === null) totals.sessionsWithoutCheckout += 1;
    if (hasDuration) {
      totals.sessionsWithDuration += 1;
      totals.minutes += duration;
      totals.kcal += sessionKcal;
      if (duration > LONG_SESSION_MIN) totals.longSessions += 1;
      const week = weekStartOf(localDate(s.started_at));
      const w = byWeek.get(week) ?? { kcal: 0, sessions: 0 };
      w.kcal += sessionKcal;
      w.sessions += 1;
      byWeek.set(week, w);
    }

    result.push({
      id: s.id,
      name: s.workout_name_snapshot,
      date: localDate(s.started_at),
      durationMin: duration !== null && duration > 0 ? duration : null,
      sets: sLogs.length,
      kcal: sessionKcal,
      partial,
    });
  }

  return {
    sessions: result,
    exercises: [...byExercise.values()].sort((a, b) => (b.kcal ?? -1) - (a.kcal ?? -1) || b.sets - a.sets),
    weeks: [...byWeek.entries()].map(([weekStart, v]) => ({ weekStart, ...v })).sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    totals,
  };
}

const int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

// Sempre com "≈" para deixar claro que é aproximação.
export function formatKcal(v: number) {
  return `≈ ${int.format(Math.round(v))} kcal`;
}
export function formatMinutes(v: number) {
  return v >= 60 ? `${Math.floor(v / 60)} h ${int.format(Math.round(v % 60))} min` : `${int.format(Math.round(v))} min`;
}
export function formatKcalPerMin(v: number) {
  return `${dec.format(v)} kcal/min`;
}
