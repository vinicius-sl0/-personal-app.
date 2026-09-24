"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SessionState = { error?: string; sessionId?: string; startedAt?: string };

export type LoggedSet = {
  workout_exercise_id: string;
  set_number: number;
  reps_done: number | null;
  load_kg: number | null;
};

// Retoma a sessão EM ANDAMENTO deste navegador (ex.: a página recarregou no meio do treino),
// junto com as séries já registradas. Sessão finalizada não é retomada.
export async function resumeSession(
  clientUuid: string,
): Promise<{ error?: string; sessionId?: string; startedAt?: string; sets?: LoggedSet[] }> {
  await requireRole("aluno");
  if (!z.uuid().safeParse(clientUuid).success) return {};

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .select("id, started_at, status, set_logs(workout_exercise_id, set_number, reps_done, load_kg, completed)")
    .eq("client_uuid", clientUuid)
    .maybeSingle();
  if (error) return { error: "Não foi possível verificar o treino em andamento: " + error.message };
  if (!session || session.status !== "em_andamento") return {};

  return {
    sessionId: session.id,
    startedAt: session.started_at,
    sets: session.set_logs
      .filter((l) => l.completed && l.workout_exercise_id)
      .map((l) => ({
        workout_exercise_id: l.workout_exercise_id!,
        set_number: l.set_number,
        reps_done: l.reps_done,
        load_kg: l.load_kg,
      })),
  };
}

// CHECK-IN: cria a sessão de treino (registra data e horário de entrada).
// Idempotente pelo client_uuid: se a gravação já tinha acontecido, devolve a mesma sessão.
export async function startSession(
  workoutId: string,
  clientUuid: string,
): Promise<SessionState> {
  await requireRole("aluno");
  if (!z.uuid().safeParse(workoutId).success) return { error: "Treino inválido." };
  if (!z.uuid().safeParse(clientUuid).success) return { error: "Identificador de sessão inválido." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id, started_at, status")
    .eq("client_uuid", clientUuid)
    .maybeSingle();
  if (existing) {
    if (existing.status !== "em_andamento") {
      return { error: "Este treino já foi finalizado. Recarregue a página para fazer um novo check-in." };
    }
    return { sessionId: existing.id, startedAt: existing.started_at };
  }

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, name, plan_id")
    .eq("id", workoutId)
    .maybeSingle();
  if (!workout) return { error: "Treino não encontrado." };

  const { data: student } = await supabase.from("students").select("id").maybeSingle();
  if (!student) return { error: "Cadastro de aluno não encontrado." };

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      student_id: student.id,
      workout_id: workout.id,
      plan_id: workout.plan_id,
      workout_name_snapshot: workout.name,
      client_uuid: clientUuid,
    })
    .select("id, started_at")
    .single();

  if (error || !session) return { error: "Não foi possível fazer o check-in: " + error?.message };
  return { sessionId: session.id, startedAt: session.started_at };
}

const setSchema = z.object({
  session_id: z.uuid(),
  workout_exercise_id: z.uuid(),
  exercise_id: z.uuid(),
  exercise_name: z.string().min(1).max(150),
  set_number: z.coerce.number().int().min(1).max(100),
  reps_done: z.coerce.number().int().min(0).max(1000).nullable(),
  load_kg: z.coerce.number().min(0).max(999).nullable(),
});

// Registra (ou substitui) uma série. Idempotente: reenviar a mesma série não duplica.
export async function logSet(input: unknown): Promise<{ error?: string }> {
  await requireRole("aluno");
  const parsed = setSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados da série inválidos." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("set_logs").upsert(
    {
      session_id: d.session_id,
      workout_exercise_id: d.workout_exercise_id,
      exercise_id: d.exercise_id,
      exercise_name_snapshot: d.exercise_name,
      set_number: d.set_number,
      reps_done: d.reps_done,
      load_kg: d.load_kg,
      completed: true,
    },
    { onConflict: "session_id,workout_exercise_id,set_number" },
  );

  if (error) return { error: "Não foi possível salvar a série: " + error.message };
  return {};
}

// CHECK-OUT: finaliza a sessão (registra o horário de saída).
export async function finishSession(sessionId: string): Promise<{ error?: string; ok?: boolean }> {
  await requireRole("aluno");
  if (!z.uuid().safeParse(sessionId).success) return { error: "Sessão de treino inválida." };

  const supabase = await createClient();
  // .select() para saber se alguma linha foi de fato alterada (a RLS bloqueia sem dar erro).
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ status: "concluida", finished_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "em_andamento")
    .select("id")
    .maybeSingle();

  if (error) return { error: "Não foi possível fazer o check-out: " + error.message };
  if (!data) return { error: "Treino não encontrado ou já finalizado." };

  revalidatePath("/aluno/treinos");
  revalidatePath("/aluno/treinos/historico");
  return { ok: true };
}
