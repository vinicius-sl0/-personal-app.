import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadMessages } from "@/lib/chat-data";
import { errorCls } from "@/lib/ui";
import ChatRoom from "@/components/chat-room";

export const metadata = { title: "Mensagens" };

export default async function MensagensAlunoPage() {
  const profile = await requireRole("aluno");
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro e a conversa do próprio aluno.
  const [{ data: student }, { data: conversation, error }] = await Promise.all([
    supabase.from("students").select("id, status").maybeSingle(),
    supabase.from("conversations").select("id, personal_id").maybeSingle(),
  ]);

  if (error) return <p className={errorCls}>Não foi possível abrir a conversa: {error.message}</p>;
  if (!student || !conversation) return <p className={errorCls}>Conversa não encontrada.</p>;

  const [{ data: personal }, initial] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", conversation.personal_id).maybeSingle(),
    loadMessages(supabase, conversation.id),
  ]);
  const personalName = personal?.full_name ?? "seu Personal";

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-bold">Conversa com {personalName}</h1>
      {initial.error ? (
        <p className={errorCls}>Não foi possível carregar as mensagens: {initial.error}</p>
      ) : (
        <ChatRoom
          conversationId={conversation.id}
          myId={profile.id}
          otherName={personalName}
          initialMessages={initial.messages}
          initialHasMore={initial.hasMore}
          canPost={student.status === "ativo" || student.status === "pausado"}
          cannotPostReason="Seu acesso ainda não está ativo, então não é possível enviar mensagens."
        />
      )}
    </section>
  );
}
