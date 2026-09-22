"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { planSchema } from "./schema";

export type PlanFormState = { error?: string };

function parsePayload(formData: FormData) {
  const raw = String(formData.get("payload") ?? "");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Dados do formulário corrompidos. Recarregue a página." } as const;
  }
  const parsed = planSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." } as const;
  }
  return { ok: true, data: parsed.data } as const;
}

// Grava a ficha (rascunho ou publicada) em uma única transação lógica:
// 1) upsert do plano  2) apaga treinos/exercícios antigos  3) recria do zero.
// Simples e seguro para o tamanho de uma ficha; evita lidar com diffs parciais.
async function savePlan(
  studentId: string,
  personalId: string,
  data: z.infer<typeof planSchema>,
  status: "rascunho" | "ativo",
  existingPlanId?: string,
) {
  const supabase = await createClient();

  let planId = existingPlanId;

  if (planId) {
    const { error } = await supabase
      .from("workout_plans")
      .update({ name: data.name, objective: data.objective, status })
      .eq("id", planId);
    if (error) return { error: "Não foi possível salvar a ficha: " + error.message };

    // Removendo os treinos, os exercícios (workout_exercises) somem em cascata.
    await supabase.from("workouts").delete().eq("plan_id", planId);
  } else {
    const { data: plan, error } = await supabase
      .from("workout_plans")
      .insert({
        personal_id: personalId,
        student_id: studentId,
        name: data.name,
        objective: data.objective,
        status,
      })
      .select("id")
      .single();
    if (error || !plan) return { error: "Não foi possível criar a ficha: " + error?.message };
    planId = plan.id;
  }

  for (let wi = 0; wi < data.workouts.length; wi++) {
    const w = data.workouts[wi];
    const { data: workout, error: wErr } = await supabase
      .from("workouts")
      .insert({ plan_id: planId, name: w.name, position: wi, notes: w.notes })
      .select("id")
      .single();
    if (wErr || !workout) return { error: "Não foi possível salvar um treino: " + wErr?.message };

    const rows = w.exercises.map((ex, i) => ({
      workout_id: workout.id,
      exercise_id: ex.exercise_id,
      position: i,
      sets: ex.sets,
      reps_min: ex.reps_min,
      reps_max: ex.reps_max,
      reps_text: ex.reps_text,
      target_load_kg: ex.target_load_kg,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes,
    }));
    const { error: eErr } = await supabase.from("workout_exercises").insert(rows);
    if (eErr) return { error: "Não foi possível salvar os exercícios: " + eErr.message };
  }

  return { planId } as const;
}

export async function createPlan(
  studentId: string,
  status: "rascunho" | "ativo",
  _prev: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const profile = await requireRole("personal");
  if (!z.uuid().safeParse(studentId).success) return { error: "Aluno inválido." };

  const parsed = parsePayload(formData);
  if (!parsed.ok) return { error: parsed.error };

  const result = await savePlan(studentId, profile.id, parsed.data, status);
  if ("error" in result) return { error: result.error };

  revalidatePath(`/personal/alunos/${studentId}`);
  revalidatePath(`/personal/alunos/${studentId}/treinos`);
  redirect(`/personal/alunos/${studentId}/treinos/${result.planId}`);
}

export async function updatePlan(
  studentId: string,
  planId: string,
  status: "rascunho" | "ativo",
  _prev: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const profile = await requireRole("personal");
  if (!z.uuid().safeParse(studentId).success || !z.uuid().safeParse(planId).success) {
    return { error: "Dados inválidos." };
  }

  const parsed = parsePayload(formData);
  if (!parsed.ok) return { error: parsed.error };

  const result = await savePlan(studentId, profile.id, parsed.data, status, planId);
  if ("error" in result) return { error: result.error };

  revalidatePath(`/personal/alunos/${studentId}`);
  revalidatePath(`/personal/alunos/${studentId}/treinos`);
  revalidatePath(`/personal/alunos/${studentId}/treinos/${planId}`);
  redirect(`/personal/alunos/${studentId}/treinos/${planId}`);
}

export async function archivePlan(formData: FormData) {
  await requireRole("personal");
  const id = String(formData.get("plan_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  if (!z.uuid().safeParse(id).success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_plans")
    .update({ status: "arquivado" })
    .eq("id", id);
  if (error) console.error("archivePlan:", error.message);

  revalidatePath(`/personal/alunos/${studentId}`);
  revalidatePath(`/personal/alunos/${studentId}/treinos`);
}
