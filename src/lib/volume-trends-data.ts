import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { currentMonth, formatMonth, shiftMonth, weekRange } from "@/lib/attendance";
import { currentWeekStart, formatWeek, shiftWeek, shortDate, weekStartOf } from "@/lib/feedback";
import { computeTrend, type MuscleMap } from "@/lib/volume";
import { estimateCalories } from "@/lib/calories";
import { loadExerciseKcal, loadLoggedInputs, loadMuscleMap, loadSessions } from "@/lib/volume-data";
import type { TrendRow } from "@/components/volume-trends";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const monthShort = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "");
};

// Evolução do volume REALIZADO: 26 semanas e 6 meses, com séries, repetições, carga,
// calorias estimadas e número de treinos (com check-out). Usado na Análise de volume e na Evolução.
export async function loadVolumeTrends(
  supabase: Supabase,
  studentId: string,
  secondaryWeight: number,
  opts: { workoutId?: string; muscleId?: string | null; map?: MuscleMap } = {},
): Promise<{ weekly: TrendRow[]; monthly: TrendRow[]; error: string | null }> {
  const thisWeek = currentWeekStart();
  const weekKeys = Array.from({ length: 26 }, (_, i) => shiftWeek(thisWeek, i - 25));
  const monthKeys = Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth(), i - 5));
  // começa no que vier antes: a 1ª das 26 semanas ou o dia 1 do 1º dos 6 meses
  const firstDay = [weekKeys[0], `${monthKeys[0]}-01`].sort()[0];
  const range = { from: `${firstDay}T00:00:00-03:00`, to: weekRange(thisWeek).to };

  const [logsRes, sessRes] = await Promise.all([
    loadLoggedInputs(supabase, studentId, range, opts.workoutId),
    loadSessions(supabase, studentId, range, opts.workoutId),
  ]);
  const error = logsRes.error ?? sessRes.error;
  if (error) return { weekly: [], monthly: [], error };

  const ids = logsRes.inputs.map((i) => i.exerciseId).filter((x): x is string => !!x);
  const [mapRes, kcalRes] = await Promise.all([
    opts.map ? Promise.resolve({ map: opts.map, error: null }) : loadMuscleMap(supabase, ids),
    loadExerciseKcal(supabase, ids),
  ]);
  if (mapRes.error || kcalRes.error) return { weekly: [], monthly: [], error: mapRes.error ?? kcalRes.error };
  // O mapa recebido pode não ter todos os exercícios do período maior: completa o que faltar.
  let map = mapRes.map;
  const missing = ids.filter((id) => !map[id]);
  if (missing.length) {
    const extra = await loadMuscleMap(supabase, missing);
    map = { ...map, ...extra.map };
  }

  const est = estimateCalories(sessRes.sessions, logsRes.logs, kcalRes.kcal);
  const sumBy = (keyOf: (day: string) => string, pick: (x: (typeof est.sessions)[number]) => number) => {
    const m = new Map<string, number>();
    for (const x of est.sessions) if (x.durationMin !== null) m.set(keyOf(x.date), (m.get(keyOf(x.date)) ?? 0) + pick(x));
    return m;
  };
  const wk = (day: string) => weekStartOf(day);
  const mo = (day: string) => day.slice(0, 7);
  const wv = computeTrend(logsRes.inputs, map, secondaryWeight, weekKeys, wk, opts.muscleId);
  const mv = computeTrend(logsRes.inputs, map, secondaryWeight, monthKeys, mo, opts.muscleId);
  const wKcal = sumBy(wk, (x) => x.kcal);
  const mKcal = sumBy(mo, (x) => x.kcal);
  const wSess = sumBy(wk, () => 1);
  const mSess = sumBy(mo, () => 1);

  return {
    weekly: weekKeys.map((k) => ({ key: k, label: shortDate(k), title: formatWeek(k), ...wv[k], kcal: Math.round(wKcal.get(k) ?? 0), sessions: wSess.get(k) ?? 0 })),
    monthly: monthKeys.map((k) => ({ key: k, label: monthShort(k), title: formatMonth(k), ...mv[k], kcal: Math.round(mKcal.get(k) ?? 0), sessions: mSess.get(k) ?? 0 })),
    error: null,
  };
}
