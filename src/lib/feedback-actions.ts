"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentWeekStart, TEXT_MAX } from "@/lib/feedback";

export type FeedbackFormState = { error?: string; ok?: boolean };

const scale = z.coerce
  .number({ error: "Responda todas as perguntas de 1 a 5." })
  .int()
  .min(1, "Responda todas as perguntas de 1 a 5.")
  .max(5, "Responda todas as perguntas de 1 a 5.");

const optionalText = z
  .string()
  .trim()
  .max(TEXT_MAX, `Cada texto pode ter no máximo ${TEXT_MAX} caracteres.`)
  .transform((v) => v || null);

const feedbackSchema = z.object({
  training_feeling: scale,
  energy: scale,
  diet_adherence: scale,
  progress_feeling: scale,
  difficulties: optionalText,
  pain_notes: optionalText,
  comment: optionalText,
});

function revalidateFeedback(studentId: string) {
  revalidatePath("/aluno");
  revalidatePath("/aluno/feedback");
  revalidatePath("/personal");
  revalidatePath("/personal/feedback");
  revalidatePath(`/personal/alunos/${studentId}/feedback`);
}

// O aluno envia (ou corrige, enquanto não foi respondido) o feedback da semana atual.
// A semana é sempre calculada aqui no servidor, nunca vem do navegador.
export async function saveFeedback(_prev: FeedbackFormState, formData: FormData): Promise<FeedbackFormState> {
  await requireRole("aluno");

  const raw = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? undefined : v;
  };
  const parsed = feedbackSchema.safeParse({
    training_feeling: raw("training_feeling"),
    energy: raw("energy"),
    diet_adherence: raw("diet_adherence"),
    progress_feeling: raw("progress_feeling"),
    difficulties: String(formData.get("difficulties") ?? ""),
    pain_notes: String(formData.get("pain_notes") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira as respostas." };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id").maybeSingle();
  if (!student) return { error: "Cadastro de aluno não encontrado." };

  const weekStart = currentWeekStart();
  const { data: existing, error: readError } = await supabase
    .from("weekly_checkins")
    .select("id, replied_at")
    .eq("student_id", student.id)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (readError) return { error: "Não foi possível salvar o feedback: " + readError.message };

  if (existing) {
    if (existing.replied_at) {
      return { error: "Seu Personal já respondeu este feedback, então ele não pode mais ser alterado." };
    }
    const { data: updated, error } = await supabase
      .from("weekly_checkins")
      .update({ ...d, submitted_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id");
    if (error) return { error: "Não foi possível salvar o feedback: " + error.message };
    if (!updated?.length) return { error: "Não foi possível salvar o feedback. Recarregue a página e tente de novo." };
  } else {
    const { error } = await supabase
      .from("weekly_checkins")
      .insert({ ...d, student_id: student.id, week_start: weekStart });
    if (error?.code === "23505") {
      return { error: "Este feedback acabou de ser enviado de outro lugar. Recarregue a página." };
    }
    if (error) return { error: "Não foi possível enviar o feedback: " + error.message };
  }

  revalidateFeedback(student.id);
  return { ok: true };
}

const replySchema = z.object({
  id: z.uuid(),
  reply: z
    .string()
    .trim()
    .min(1, "Escreva a resposta.")
    .max(2000, "A resposta pode ter no máximo 2000 caracteres."),
});

// O Personal responde (ou corrige a resposta de) um feedback semanal. O banco grava data e autor.
export async function replyFeedback(_prev: FeedbackFormState, formData: FormData): Promise<FeedbackFormState> {
  await requireRole("personal");
  const parsed = replySchema.safeParse({ id: formData.get("id"), reply: formData.get("reply") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Resposta inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_checkins")
    .update({ personal_reply: parsed.data.reply })
    .eq("id", parsed.data.id)
    .select("student_id")
    .maybeSingle();
  if (error) return { error: "Não foi possível salvar a resposta: " + error.message };
  if (!data) return { error: "Feedback não encontrado." };

  revalidateFeedback(data.student_id);
  return { ok: true };
}
