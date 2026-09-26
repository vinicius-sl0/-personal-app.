import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { unreadCounts } from "@/lib/notification-data";
import { MessagesDot, NotificationBell, NotificationCountsProvider } from "@/components/notification-badges";

export default async function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("personal");
  const supabase = await createClient();
  const [counts, { count: pendingFeedbacks }] = await Promise.all([
    unreadCounts(supabase, profile.id),
    supabase.from("weekly_checkins").select("id", { count: "exact", head: true }).is("replied_at", null),
  ]);

  return (
    <NotificationCountsProvider userId={profile.id} initial={counts}>
      <div className="min-h-dvh">
        <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Personal</p>
              <p className="font-semibold">{profile.full_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell href="/personal/notificacoes" />
              <form action={signOut}>
                <button className="h-10 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700">
                  Sair
                </button>
              </form>
            </div>
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
              <MessagesDot />
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl p-4">{children}</main>
      </div>
    </NotificationCountsProvider>
  );
}
