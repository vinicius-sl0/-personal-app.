"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SessionState = { error?: string; sessionId?: string };

// Cria (ou reaproveita, se a aba recarregar) a sessão de execução do treino de hoje.
export async function startSession(
  workoutId: string,
  clientUuid: string,
): Promise<SessionState> {
  await requireRole("aluno");
  if (!z.uuid().safeParse(workoutId).success) return { error: "Treino inválido." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("client_uuid", clientUuid)
    .maybeSingle();
  if (existing) return { sessionId: existing.id };

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
    .select("id")
    .single();

  if (error || !session) return { error: "Não foi possível iniciar o treino: " + error?.message };
  return { sessionId: session.id };
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

export async function finishSession(formData: FormData): Promise<{ error?: string }> {
  await requireRole("aluno");
  const sessionId = String(formData.get("session_id") ?? "");
  if (!z.uuid().safeParse(sessionId).success) return { error: "Sessão de treino inválida." };

  const supabase = await createClient();
  // .select() para saber se alguma linha foi de fato alterada (a RLS bloqueia sem dar erro).
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ status: "concluida", finished_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Não foi possível finalizar o treino: " + error.message };
  if (!data) return { error: "Sessão de treino não encontrada." };

  revalidatePath("/aluno/treinos");
  revalidatePath("/aluno/treinos/historico");
  redirect("/aluno/treinos/historico?concluido=1");
}
