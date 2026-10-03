"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Lembrete automático do Feedback semanal (migração 20261003000002): o Personal liga/desliga e
// escolhe dia e hora. O envio é feito pelo próprio banco (pg_cron), não por esta tela.
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
