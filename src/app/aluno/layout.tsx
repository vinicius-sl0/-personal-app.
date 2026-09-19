import { requireRole } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("aluno");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Aluno</p>
          <p className="font-semibold">{profile.full_name}</p>
        </div>
        <form action={signOut}>
          <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
            Sair
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-md p-4">{children}</main>
    </div>
  );
}
