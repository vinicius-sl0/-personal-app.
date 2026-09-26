import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthLayout from "@/components/auth-layout";
import { btnPrimaryCls } from "@/lib/ui";
import NewPasswordForm from "./new-password-form";

export const metadata = { title: "Nova senha" };

// Chega aqui pelo link do e-mail (que já abriu uma sessão temporária em /auth/confirm).
export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <AuthLayout title="Crie uma nova senha" description="Use pelo menos 8 caracteres. Evite senhas óbvias, como datas ou sequências.">
      {data.user ? (
        <NewPasswordForm />
      ) : (
        <div className="space-y-4 text-sm">
          <p>Esse link expirou ou já foi usado.</p>
          <Link href="/recuperar-senha" className={btnPrimaryCls}>
            Pedir um novo link
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
