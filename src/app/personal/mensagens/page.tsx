import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { unreadConversationIds } from "@/lib/chat-data";
import { formatMessageTime } from "@/lib/chat";
import { errorCls } from "@/lib/ui";

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

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Mensagens</h1>

      {error && <p className={errorCls}>Não foi possível carregar as conversas: {error.message}</p>}

      {!error && visible.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhuma conversa ainda. Assim que um aluno ativar a conta, a conversa com ele aparece aqui.
        </p>
      )}

      <ul className="space-y-2">
        {visible.map((c) => {
          const isUnread = unread.has(c.id);
          return (
            <li key={c.id}>
              <Link
                href={`/personal/alunos/${c.student_id}/mensagens`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <span className="min-w-0">
                  <span className={`block truncate ${isUnread ? "font-bold" : "font-medium"}`}>
                    {c.students?.full_name ?? "Aluno"}
                  </span>
                  <span className="block text-sm text-zinc-500">
                    {c.last_message_at ? `Última mensagem: ${formatMessageTime(c.last_message_at)}` : "Sem mensagens"}
                  </span>
                </span>
                {isUnread && (
                  <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                    Nova
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
