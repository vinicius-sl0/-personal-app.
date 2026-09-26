import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth";
import { conversationIdOf, NOTIFICATION_COLUMNS, type NotificationRow } from "@/lib/notifications";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Contadores iniciais do sino e da bolinha de mensagens (depois o navegador atualiza sozinho).
export async function unreadCounts(supabase: Supabase, userId: string) {
  const base = () =>
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
  const [all, msgs] = await Promise.all([base(), base().eq("type", "nova_mensagem")]);
  return { total: all.count ?? 0, messages: msgs.count ?? 0 };
}

export type NotificationView = NotificationRow & { detail: string | null };

// Últimos avisos, com um complemento legível (ex.: de qual aluno é a mensagem).
export async function loadNotifications(
  supabase: Supabase,
  userId: string,
  role: Role,
): Promise<{ items: NotificationView[]; error: string | null }> {
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { items: [], error: error.message };

  const rows = data as NotificationRow[];
  const nameByConversation = new Map<string, string>();
  if (role === "personal") {
    const ids = [...new Set(rows.map(conversationIdOf).filter((x): x is string => !!x))];
    if (ids.length > 0) {
      const { data: convs } = await supabase.from("conversations").select("id, students(full_name)").in("id", ids);
      for (const c of convs ?? []) if (c.students?.full_name) nameByConversation.set(c.id, c.students.full_name);
    }
  }

  const items = rows.map((n) => {
    let detail = n.body;
    if (n.type === "nova_mensagem") {
      const name = nameByConversation.get(conversationIdOf(n) ?? "");
      detail = role === "aluno" ? "Do seu Personal" : name ? `De ${name}` : null;
    }
    return { ...n, detail };
  });
  return { items, error: null };
}
