import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { unreadConversationIds } from "@/lib/chat-data";
import { formatMessageTime } from "@/lib/chat";
import { cardCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";

export const metadata = { title: "Mensagens" };

export default async function MensagensPage() {
  const profile = await requireRole("personal");
  const supabase = await createClient();

  const [{ data: conversations, error }, unread] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, student_id, last_message_at, students(full_name, status)")
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    unreadConversationIds(supabase, profile.id),
  ]);

  // Arquivados e convites pendentes sem mensagens não poluem a lista.
  const visible = (conversations ?? []).filter(
    (c) => c.last_message_at || c.students?.status === "ativo" || c.students?.status === "pausado",
  );

  // Prévia da última mensagem de cada conversa.
  const ids = visible.filter((c) => c.last_message_at).map((c) => c.id);
  const { data: recent } = ids.length
    ? await supabase
        .from("messages")
        .select("conversation_id, sender_id, body, deleted_at, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(Math.min(ids.length * 5, 500))
    : { data: [] };
  const lastByConv = new Map<string, NonNullable<typeof recent>[number]>();
  for (const m of recent ?? []) if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);

  return (
    <>
      <PageHeader eyebrow="Mensagens" title="Conversas" description="Fale com cada aluno em tempo real." />

      {error && <ErrorState message={`Não foi possível carregar as conversas: ${error.message}`} />}

      {!error && visible.length === 0 && (
        <EmptyState
          icon={<MessagesSquare className="size-5" />}
          title="Nenhuma conversa ainda"
          description="Assim que um aluno ativar a conta, a conversa com ele aparece aqui."
        />
      )}

      {visible.length > 0 && (
      <ul className={`${cardCls} divide-y divide-line overflow-hidden`}>
        {visible.map((c) => {
          const isUnread = unread.has(c.id);
          const last = lastByConv.get(c.id);
          const name = c.students?.full_name ?? "Aluno";
          const preview = !last ? "Sem mensagens" : last.deleted_at ? "Mensagem apagada" : `${last.sender_id === profile.id ? "Você: " : ""}${last.body ?? ""}`;
          return (
            <li key={c.id}>
              <Link href={`/personal/alunos/${c.student_id}/mensagens`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-subtle">
                <Avatar name={name} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate ${isUnread ? "font-bold" : "font-medium"}`}>{name}</span>
                    {c.last_message_at && <span className="shrink-0 text-xs text-muted">{formatMessageTime(c.last_message_at)}</span>}
                  </span>
                  <span className={`block truncate text-sm ${isUnread ? "text-ink" : "text-muted"}`}>{preview}</span>
                </span>
                {isUnread && (
                  <Badge tone="brand" dot>
                    Nova
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      )}
    </>
  );
}
