"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Configuração dos avisos automáticos. O envio em si é feito pelo próprio banco (pg_cron), não
// por estas telas.

// Lembrete do Feedback semanal (migração 20261003000002): o Personal liga/desliga e escolhe dia e hora.
const schema = z.object({
  enabled: z.boolean(),
  dow: z.number().int().min(1).max(7),
  hour: z.number().int().min(0).max(23),
});

export async function setFeedbackReminder(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  const profile = await requireRole("personal");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Escolha um dia e um horário válidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personal_profiles")
    .update({
      feedback_reminder_enabled: parsed.data.enabled,
      feedback_reminder_dow: parsed.data.dow,
      feedback_reminder_hour: parsed.data.hour,
    })
    .eq("profile_id", profile.id)
    .select("profile_id");
  if (error) return { error: "Não foi possível salvar: " + error.message };
  if (!data?.length) return { error: "Perfil do Personal não encontrado. Confira se o script 06 foi rodado." };

  revalidatePath("/personal/configuracoes");
  return { ok: true };
}

// Lembrete de treino (migração 20261003000003): cada ALUNO liga/desliga e escolhe a hora no Perfil.
const trainingSchema = z.object({ enabled: z.boolean(), hour: z.number().int().min(0).max(23) });

export async function setTrainingReminder(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  const profile = await requireRole("aluno");
  const parsed = trainingSchema.safeParse(input);
  if (!parsed.success) return { error: "Escolha um horário válido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ training_reminder_enabled: parsed.data.enabled, training_reminder_hour: parsed.data.hour })
    .eq("id", profile.id)
    .select("id");
  if (error) return { error: "Não foi possível salvar: " + error.message };
  if (!data?.length) return { error: "Perfil não encontrado." };
  revalidatePath("/aluno/perfil");
  return { ok: true };
}

// Aviso de faltas (migração 20261003000003): o PERSONAL liga/desliga e escolhe quantas faltas seguidas.
const absenceSchema = z.object({ enabled: z.boolean(), days: z.number().int().min(1).max(7) });

export async function setAbsenceAlert(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  const profile = await requireRole("personal");
  const parsed = absenceSchema.safeParse(input);
  if (!parsed.success) return { error: "Escolha um número de faltas válido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personal_profiles")
    .update({ absence_alert_enabled: parsed.data.enabled, absence_alert_days: parsed.data.days })
    .eq("profile_id", profile.id)
    .select("profile_id");
  if (error) return { error: "Não foi possível salvar: " + error.message };
  if (!data?.length) return { error: "Perfil do Personal não encontrado. Confira se o script 06 foi rodado." };
  revalidatePath("/personal/configuracoes");
  return { ok: true };
}
