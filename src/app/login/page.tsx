import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { signOut } from "./actions";
import LoginForm from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const { user, profile } = await getSession();

  // Já logado com perfil: vai direto para a área do seu papel.
  if (user && profile) redirect(homeFor(profile.role));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-1 mb-8 text-sm text-zinc-500">
        Acesse sua conta para ver seus treinos e avaliações.
      </p>

      {user && !profile ? (
        <div className="space-y-4">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Sua conta ainda não tem acesso liberado. Fale com o seu Personal.
          </p>
          <form action={signOut}>
            <button className="h-12 w-full rounded-lg border border-zinc-300 text-base font-medium dark:border-zinc-700">
              Sair
            </button>
          </form>
        </div>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
