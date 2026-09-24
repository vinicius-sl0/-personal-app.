import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { MESSAGE_COLUMNS, MESSAGES_PAGE, type ChatMessage } from "@/lib/chat";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Últimas mensagens da conversa (ou as anteriores a `before`), em ordem cronológica.
// A RLS garante que só os dois participantes conseguem ler.
export async function loadMessages(
  supabase: Supabase,
  conversationId: string,
  before?: string,
): Promise<{ messages: ChatMessage[]; hasMore: boolean; error: string | null }> {
  let query = supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MESSAGES_PAGE + 1);
  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) return { messages: [], hasMore: false, error: error.message };

  const hasMore = data.length > MESSAGES_PAGE;
  return { messages: data.slice(0, MESSAGES_PAGE).reverse(), hasMore, error: null };
}

// Conversas com mensagem que o usuário ainda não viu.
// Enviar uma mensagem também marca a conversa como lida, então "última mensagem depois
// da última leitura" significa "chegou algo novo do outro lado".
export async function unreadConversationIds(supabase: Supabase, userId: string) {
  const [{ data: conversations }, { data: reads }] = await Promise.all([
    supabase.from("conversations").select("id, last_message_at").not("last_message_at", "is", null),
    supabase.from("conversation_reads").select("conversation_id, last_read_at").eq("user_id", userId),
  ]);
  const lastRead = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]));
  return new Set(
    (conversations ?? [])
      .filter((c) => {
        const read = lastRead.get(c.id);
        return !read || new Date(c.last_message_at!) > new Date(read);
      })
      .map((c) => c.id),
  );
}
