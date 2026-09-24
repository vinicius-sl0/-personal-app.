import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { unreadConversationIds } from "@/lib/chat-data";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("aluno");
  const hasUnread = (await unreadConversationIds(await createClient(), profile.id)).size > 0;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Aluno</p>
            <p className="font-semibold">{profile.full_name}</p>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
              Sair
            </button>
          </form>
        </div>
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/aluno" className="underline-offset-4 hover:underline">
            Início
          </Link>
          <Link href="/aluno/treinos" className="underline-offset-4 hover:underline">
            Treinos
          </Link>
          <Link href="/aluno/avaliacoes" className="underline-offset-4 hover:underline">
            Evolução
          </Link>
          <Link href="/aluno/feedback" className="underline-offset-4 hover:underline">
            Feedback
          </Link>
          <Link href="/aluno/fotos" className="underline-offset-4 hover:underline">
            Fotos
          </Link>
          <Link href="/aluno/mensagens" className="underline-offset-4 hover:underline">
            Mensagens
            {hasUnread && (
              <span aria-label="(nova mensagem)" className="ml-1 inline-block size-2 rounded-full bg-emerald-600 align-middle" />
            )}
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-md p-4">{children}</main>
    </div>
  );
}
