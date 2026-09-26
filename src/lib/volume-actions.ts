"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const weightSchema = z.union([z.literal(0), z.literal(0.5), z.literal(1)]);

// O Personal escolhe quanto uma série vale para os grupos musculares secundários.
export async function setSecondaryWeight(value: number): Promise<{ error?: string; ok?: boolean }> {
  const profile = await requireRole("personal");
  const parsed = weightSchema.safeParse(value);
  if (!parsed.success) return { error: "Opção inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personal_profiles")
    .update({ secondary_muscle_weight: parsed.data })
    .eq("profile_id", profile.id)
    .select("profile_id");
  if (error) return { error: "Não foi possível salvar: " + error.message };
  if (!data?.length) return { error: "Perfil do Personal não encontrado. Confira se o script 06 foi rodado." };

  revalidatePath("/personal", "layout");
  return { ok: true };
}
