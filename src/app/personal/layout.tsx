import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { unreadConversationIds } from "@/lib/chat-data";

export default async function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("personal");
  const supabase = await createClient();
  const [unread, { count: pendingFeedbacks }] = await Promise.all([
    unreadConversationIds(supabase, profile.id),
    supabase.from("weekly_checkins").select("id", { count: "exact", head: true }).is("replied_at", null),
  ]);
  const hasUnread = unread.size > 0;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Personal</p>
            <p className="font-semibold">{profile.full_name}</p>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
              Sair
            </button>
          </form>
        </div>
        <nav className="mx-auto mt-3 flex w-full max-w-3xl flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/personal" className="underline-offset-4 hover:underline">
            Início
          </Link>
          <Link href="/personal/alunos" className="underline-offset-4 hover:underline">
            Alunos
          </Link>
          <Link href="/personal/exercicios" className="underline-offset-4 hover:underline">
            Exercícios
          </Link>
          <Link href="/personal/frequencia" className="underline-offset-4 hover:underline">
            Frequência
          </Link>
          <Link href="/personal/feedback" className="underline-offset-4 hover:underline">
            Feedback
            {!!pendingFeedbacks && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">{pendingFeedbacks}</span>
            )}
          </Link>
          <Link href="/personal/mensagens" className="underline-offset-4 hover:underline">
            Mensagens
            {hasUnread && (
              <span aria-label="(nova mensagem)" className="ml-1 inline-block size-2 rounded-full bg-emerald-600 align-middle" />
            )}
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl p-4">{children}</main>
    </div>
  );
}
