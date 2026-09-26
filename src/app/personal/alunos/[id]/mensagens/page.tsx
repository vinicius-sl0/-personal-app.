import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadMessages, loadOtherLastRead } from "@/lib/chat-data";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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

  const [initial, otherRead] = conversation
    ? await Promise.all([loadMessages(supabase, conversation.id), loadOtherLastRead(supabase, conversation.id, profile.id)])
    : [null, null];

  return (
    <section className="space-y-4">
      <Link href="/personal/mensagens" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Todas as conversas
      </Link>
      <header className="flex items-center gap-3">
        <Avatar name={student.full_name} ring={student.status === "ativo"} />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">
            <Link href={`/personal/alunos/${id}`} className="hover:text-brand-ink">
              {student.full_name}
            </Link>
          </h1>
          <p className="text-sm text-muted">Aluno · toque no nome para ver o perfil</p>
        </div>
      </header>

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
          otherLastReadAt={otherRead}
          canPost={student.status === "ativo" || student.status === "pausado"}
          cannotPostReason={CANNOT_POST[student.status]}
        />
      )}
    </section>
  );
}
