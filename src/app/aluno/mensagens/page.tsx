import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadMessages, loadOtherLastRead } from "@/lib/chat-data";
import { Avatar } from "@/components/ui/avatar";
import { ErrorState } from "@/components/ui/states";
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

  if (error) return <ErrorState message={`Não foi possível abrir a conversa: ${error.message}`} />;
  if (!student || !conversation) return <ErrorState message="Conversa não encontrada." />;

  const [{ data: personal }, initial, otherRead] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", conversation.personal_id).maybeSingle(),
    loadMessages(supabase, conversation.id),
    loadOtherLastRead(supabase, conversation.id, profile.id),
  ]);
  const personalName = personal?.full_name ?? "seu Personal";

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3">
        <Avatar name={personalName} ring />
        <div>
          <h1 className="text-xl font-bold tracking-tight">{personalName}</h1>
          <p className="text-sm text-muted">Seu Personal Trainer</p>
        </div>
      </header>
      {initial.error ? (
        <ErrorState message={`Não foi possível carregar as mensagens: ${initial.error}`} />
      ) : (
        <ChatRoom
          conversationId={conversation.id}
          myId={profile.id}
          otherName={personalName}
          initialMessages={initial.messages}
          initialHasMore={initial.hasMore}
          otherLastReadAt={otherRead}
          canPost={student.status === "ativo" || student.status === "pausado"}
          cannotPostReason="Seu acesso ainda não está ativo, então não é possível enviar mensagens."
        />
      )}
    </section>
  );
}
