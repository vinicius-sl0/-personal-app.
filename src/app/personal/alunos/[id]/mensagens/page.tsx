import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadMessages } from "@/lib/chat-data";
import { errorCls } from "@/lib/ui";
import ChatRoom from "@/components/chat-room";

export const metadata = { title: "Mensagens" };

const CANNOT_POST: Record<string, string> = {
  convidado: "O aluno ainda não ativou a conta. Depois que ele aceitar o convite, vocês podem conversar.",
  arquivado: "Este aluno está arquivado. Para conversar de novo, reative o cadastro.",
};

export default async function MensagensAlunoPersonalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("personal");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: conversation, error }] = await Promise.all([
    supabase.from("students").select("id, full_name, status").eq("id", id).maybeSingle(),
    supabase.from("conversations").select("id").eq("student_id", id).maybeSingle(),
  ]);
  if (!student) notFound();

  const initial = conversation ? await loadMessages(supabase, conversation.id) : null;

  return (
    <section className="space-y-3">
      <div>
        <Link href="/personal/mensagens" className="text-sm text-muted underline">
          ← Todas as conversas
        </Link>
        <h1 className="mt-2 text-xl font-bold">
          <Link href={`/personal/alunos/${id}`} className="underline-offset-4 hover:underline">
            {student.full_name}
          </Link>
        </h1>
      </div>

      {error && <p className={errorCls}>Não foi possível abrir a conversa: {error.message}</p>}
      {!error && !conversation && <p className={errorCls}>Conversa não encontrada.</p>}
      {initial?.error && <p className={errorCls}>Não foi possível carregar as mensagens: {initial.error}</p>}

      {conversation && initial && !initial.error && (
        <ChatRoom
          conversationId={conversation.id}
          myId={profile.id}
          otherName={student.full_name}
          initialMessages={initial.messages}
          initialHasMore={initial.hasMore}
          canPost={student.status === "ativo" || student.status === "pausado"}
          cannotPostReason={CANNOT_POST[student.status]}
        />
      )}
    </section>
  );
}
