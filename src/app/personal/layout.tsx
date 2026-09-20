import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("personal");

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
        <nav className="mx-auto mt-3 flex w-full max-w-3xl gap-4 text-sm">
          <Link href="/personal" className="underline-offset-4 hover:underline">
            Início
          </Link>
          <Link href="/personal/alunos" className="underline-offset-4 hover:underline">
            Alunos
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl p-4">{children}</main>
    </div>
  );
}
