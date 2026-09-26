import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { localDate } from "@/lib/attendance";
import { loggedInput, plannedInput, type MuscleMap, type VolumeInput } from "@/lib/volume";
import type { CalorieLog, CalorieSession, ExerciseKcal } from "@/lib/calories";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const DEFAULT_SECONDARY_WEIGHT = 0.5;

// Configuração do Personal: quanto uma série vale para os grupos secundários.
export async function loadSecondaryWeight(supabase: Supabase, personalId: string) {
  const { data } = await supabase
    .from("personal_profiles")
    .select("secondary_muscle_weight")
    .eq("profile_id", personalId)
    .maybeSingle();
  return data ? Number(data.secondary_muscle_weight) : DEFAULT_SECONDARY_WEIGHT;
}

type MuscleRow = { id: string; name: string; sort_order: number } | null;

// Grupo principal e secundários de cada exercício (tabelas exercises + exercise_muscle_groups).
export async function loadMuscleMap(supabase: Supabase, exerciseIds: string[]): Promise<{ map: MuscleMap; error: string | null }> {
  const ids = [...new Set(exerciseIds)];
  const map: MuscleMap = {};
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase
      .from("exercises")
      .select(
        "id, name, primary:muscle_groups!exercises_primary_muscle_group_id_fkey(id, name, sort_order), exercise_muscle_groups(muscle_groups(id, name, sort_order))",
      )
      .in("id", ids.slice(i, i + 100));
    if (error) return { map, error: error.message };
    for (const e of data) {
      const p = e.primary as MuscleRow;
      map[e.id] = {
        name: e.name,
        primary: p ? { id: p.id, name: p.name, sort: p.sort_order } : null,
        secondary: e.exercise_muscle_groups
          .map((x) => x.muscle_groups as MuscleRow)
          .filter((m): m is NonNullable<MuscleRow> => !!m)
          .map((m) => ({ id: m.id, name: m.name, sort: m.sort_order })),
      };
    }
  }
  return { map, error: null };
}

export type PlanWorkout = { id: string; name: string; inputs: VolumeInput[] };

// PLANEJADO: treinos da ficha, cada um com suas linhas de exercício.
export async function loadPlanWorkouts(supabase: Supabase, planId: string): Promise<{ workouts: PlanWorkout[]; error: string | null }> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, position, workout_exercises(exercise_id, sets, reps_min, reps_max, target_load_kg)")
    .eq("plan_id", planId)
    .order("position");
  if (error) return { workouts: [], error: error.message };
  return {
    workouts: data.map((w) => ({
      id: w.id,
      name: w.name,
      inputs: w.workout_exercises.map((we) => plannedInput(we, w.id)),
    })),
    error: null,
  };
}

// REALIZADO: todas as séries concluídas do aluno no período (paginado de 1000 em 1000).
export async function loadLoggedInputs(
  supabase: Supabase,
  studentId: string,
  range: { from: string; to: string },
  workoutId?: string,
): Promise<{ inputs: VolumeInput[]; logs: CalorieLog[]; sessions: number; days: number; error: string | null }> {
  const inputs: VolumeInput[] = [];
  const logs: CalorieLog[] = [];
  const sessionIds = new Set<string>();
  const days = new Set<string>();
  const PAGE = 1000;

  for (let offset = 0; ; offset += PAGE) {
    let query = supabase
      .from("set_logs")
      .select(
        "id, exercise_id, exercise_name_snapshot, reps_done, load_kg, session_id, workout_sessions!inner(student_id, started_at, workout_id)",
      )
      .eq("completed", true)
      .eq("workout_sessions.student_id", studentId)
      .gte("workout_sessions.started_at", range.from)
      .lte("workout_sessions.started_at", range.to)
      .order("id")
      .range(offset, offset + PAGE - 1);
    if (workoutId) query = query.eq("workout_sessions.workout_id", workoutId);

    const { data, error } = await query;
    if (error) return { inputs: [], logs: [], sessions: 0, days: 0, error: error.message };
    for (const log of data) {
      const day = localDate(log.workout_sessions.started_at);
      inputs.push(loggedInput(log, day));
      logs.push({ session_id: log.session_id, exercise_id: log.exercise_id, exercise_name: log.exercise_name_snapshot });
      sessionIds.add(log.session_id);
      days.add(day);
    }
    if (data.length < PAGE) break;
  }
  return { inputs, logs, sessions: sessionIds.size, days: days.size, error: null };
}

// Sessões (check-in/check-out) do aluno no período — para a duração das Calorias estimadas.
export async function loadSessions(
  supabase: Supabase,
  studentId: string,
  range: { from: string; to: string },
  workoutId?: string,
): Promise<{ sessions: CalorieSession[]; error: string | null }> {
  let query = supabase
    .from("workout_sessions")
    .select("id, workout_name_snapshot, started_at, finished_at, status")
    .eq("student_id", studentId)
    .gte("started_at", range.from)
    .lte("started_at", range.to)
    .order("started_at");
  if (workoutId) query = query.eq("workout_id", workoutId);
  const { data, error } = await query;
  return { sessions: data ?? [], error: error?.message ?? null };
}

// kcal/min de cada exercício (null = não cadastrado).
export async function loadExerciseKcal(supabase: Supabase, exerciseIds: string[]): Promise<{ kcal: ExerciseKcal; error: string | null }> {
  const ids = [...new Set(exerciseIds)];
  const kcal: ExerciseKcal = {};
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase.from("exercises").select("id, kcal_per_min").in("id", ids.slice(i, i + 100));
    if (error) return { kcal, error: error.message };
    for (const e of data) kcal[e.id] = e.kcal_per_min === null ? null : Number(e.kcal_per_min);
  }
  return { kcal, error: null };
}
