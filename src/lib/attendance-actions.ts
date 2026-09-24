"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const daysSchema = z.object({
  studentId: z.uuid(),
  days: z
    .array(z.number().int().min(1).max(7))
    .max(7)
    .refine((d) => new Set(d).size === d.length, "Dia repetido."),
});

// O Personal define os dias da semana combinados para o aluno treinar.
export async function setTrainingDays(studentId: string, days: number[]): Promise<{ error?: string; ok?: boolean }> {
  await requireRole("personal");
  const parsed = daysSchema.safeParse({ studentId, days });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dias inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update({ training_days: [...parsed.data.days].sort((a, b) => a - b) })
    .eq("id", parsed.data.studentId)
    .select("id");
  if (error) return { error: "Não foi possível salvar os dias: " + error.message };
  if (!data?.length) return { error: "Aluno não encontrado." };

  revalidatePath(`/personal/alunos/${studentId}`);
  revalidatePath(`/personal/alunos/${studentId}/frequencia`);
  revalidatePath("/personal/frequencia");
  return { ok: true };
}
