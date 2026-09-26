"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type NotificationActionState = { error?: string; ok?: boolean };

function revalidateAll() {
  revalidatePath("/aluno", "layout");
  revalidatePath("/personal", "layout");
}

// A RLS garante que cada pessoa só mexe nos próprios avisos; o filtro por user_id é reforço.
export async function markAllNotificationsRead(): Promise<NotificationActionState> {
  const { profile } = await getSession();
  if (!profile) return { error: "Sua sessão expirou. Entre novamente." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);
  if (error) return { error: "Não foi possível marcar como lidas: " + error.message };

  revalidateAll();
  return { ok: true };
}

export async function deleteReadNotifications(): Promise<NotificationActionState> {
  const { profile } = await getSession();
  if (!profile) return { error: "Sua sessão expirou. Entre novamente." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", profile.id)
    .not("read_at", "is", null);
  if (error) return { error: "Não foi possível apagar: " + error.message };

  revalidateAll();
  return { ok: true };
}
