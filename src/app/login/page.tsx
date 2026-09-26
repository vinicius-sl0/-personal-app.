import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { btnSecondaryCls } from "@/lib/ui";
import AuthLayout from "@/components/auth-layout";
import { signOut } from "./actions";
import LoginForm from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const { user, profile } = await getSession();

  // Já logado com perfil: vai direto para a área do seu papel.
  if (user && profile) redirect(homeFor(profile.role));

  return (
    <AuthLayout title="Bem-vindo de volta" description="Entre para ver seus treinos, sua evolução e falar com seu Personal.">
      {user && !profile ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-800 dark:text-amber-200">
            Sua conta ainda não tem acesso liberado. Fale com o seu Personal.
          </p>
          <form action={signOut}>
            <button className={`${btnSecondaryCls} w-full`}>Sair</button>
          </form>
        </div>
      ) : (
        <LoginForm />
      )}
    </AuthLayout>
  );
}
