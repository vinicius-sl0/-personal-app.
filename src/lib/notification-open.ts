import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession, homeFor, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { conversationIdOf, notificationDestination, NOTIFICATION_COLUMNS, type NotificationRow } from "@/lib/notifications";

// Abrir um aviso: marca como lido e leva para a tela certa.
// Usado pelas rotas /aluno/notificacoes/abrir/[id] e /personal/notificacoes/abrir/[id].
export async function openNotification(request: NextRequest, id: string, role: Role) {
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const { profile } = await getSession();
  if (!profile) return go("/login");
  if (profile.role !== role) return go(homeFor(profile.role));

  const list = `${homeFor(role)}/notificacoes`;
  if (!z.uuid().safeParse(id).success) return go(list);

  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select(NOTIFICATION_COLUMNS).eq("id", id).maybeSingle();
  const n = data as NotificationRow | null;
  if (!n) return go(list);

  if (!n.read_at) {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) console.error("openNotification (marcar como lido):", error.message);
  }

  let studentId: string | null = null;
  const conversationId = conversationIdOf(n);
  if (role === "personal" && n.type === "nova_mensagem" && conversationId) {
    const { data: conv } = await supabase.from("conversations").select("student_id").eq("id", conversationId).maybeSingle();
    studentId = conv?.student_id ?? null;
  }

  return go(notificationDestination(n, role, studentId));
}
