"use server";

import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadMessages } from "@/lib/chat-data";
import { MESSAGE_COLUMNS, MESSAGE_MAX_LENGTH, type ChatMessage } from "@/lib/chat";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const sendSchema = z.object({
  id: z.uuid(),
  conversation_id: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Escreva uma mensagem.")
    .max(MESSAGE_MAX_LENGTH, `A mensagem pode ter no máximo ${MESSAGE_MAX_LENGTH} caracteres.`),
});

// Marca a conversa como lida até a última mensagem existente.
// Usa o horário gravado pelo próprio banco (last_message_at) para não depender do relógio do servidor.
async function markRead(supabase: Supabase, userId: string, conversationId: string) {
  const { data: conv, error } = await supabase
    .from("conversations")
    .select("last_message_at")
    .eq("id", conversationId)
    .maybeSingle();
  if (error || !conv) return { error: error?.message ?? "Conversa não encontrada." };
  if (!conv.last_message_at) return {};

  const { error: readError } = await supabase
    .from("conversation_reads")
    .upsert(
      { conversation_id: conversationId, user_id: userId, last_read_at: conv.last_message_at },
      { onConflict: "conversation_id,user_id" },
    );
  if (readError) return { error: readError.message };

  // O aviso "Nova mensagem" desta conversa também passa a contar como lido.
  const { error: notifError } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("type", "nova_mensagem")
    .is("read_at", null)
    .eq("data->>conversation_id", conversationId);
  if (notifError) console.error("markRead (notificações):", notifError.message);
  return {};
}

// Envia uma mensagem de texto. O id vem do navegador: reenviar após uma falha de rede
// não duplica a mensagem (se ela já tinha sido gravada, devolvemos a existente).
export async function sendMessage(input: unknown): Promise<{ message?: ChatMessage; error?: string }> {
  const { profile } = await getSession();
  if (!profile) return { error: "Sua sessão expirou. Entre novamente." };

  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ id: d.id, conversation_id: d.conversation_id, sender_id: profile.id, type: "texto", body: d.body })
    .select(MESSAGE_COLUMNS)
    .single();

  let message = data;
  if (error?.code === "23505") {
    const { data: existing } = await supabase.from("messages").select(MESSAGE_COLUMNS).eq("id", d.id).maybeSingle();
    message = existing;
  }
  if (!message) {
    if (error?.code === "42501") {
      return { error: "Não é possível enviar mensagens nesta conversa agora (o aluno precisa estar ativo)." };
    }
    return { error: "Não foi possível enviar a mensagem: " + (error?.message ?? "erro desconhecido") };
  }

  const read = await markRead(supabase, profile.id, d.conversation_id);
  if (read.error) console.error("sendMessage (marcar como lida):", read.error);
  return { message };
}

// Apaga uma mensagem própria (o banco remove o texto e mantém só o aviso "mensagem apagada").
export async function deleteMessage(id: string): Promise<{ message?: ChatMessage; error?: string }> {
  const { profile } = await getSession();
  if (!profile) return { error: "Sua sessão expirou. Entre novamente." };
  if (!z.uuid().safeParse(id).success) return { error: "Mensagem não encontrada." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select(MESSAGE_COLUMNS)
    .maybeSingle();
  if (error) return { error: "Não foi possível apagar: " + error.message };
  if (!data) return { error: "Você só pode apagar as suas próprias mensagens." };
  return { message: data };
}

export async function markConversationRead(conversationId: string): Promise<{ error?: string }> {
  const { profile } = await getSession();
  if (!profile) return { error: "Sua sessão expirou. Entre novamente." };
  if (!z.uuid().safeParse(conversationId).success) return { error: "Conversa não encontrada." };
  const supabase = await createClient();
  return markRead(supabase, profile.id, conversationId);
}

// Usado para carregar mensagens antigas e para ressincronizar após perda de conexão.
export async function fetchMessages(
  conversationId: string,
  before?: string,
): Promise<{ messages: ChatMessage[]; hasMore: boolean; error: string | null }> {
  const { profile } = await getSession();
  if (!profile) return { messages: [], hasMore: false, error: "Sua sessão expirou. Entre novamente." };
  if (!z.uuid().safeParse(conversationId).success) {
    return { messages: [], hasMore: false, error: "Conversa não encontrada." };
  }
  if (before !== undefined && !z.iso.datetime({ offset: true }).safeParse(before).success) {
    return { messages: [], hasMore: false, error: "Parâmetro inválido." };
  }
  const supabase = await createClient();
  return loadMessages(supabase, conversationId, before);
}
