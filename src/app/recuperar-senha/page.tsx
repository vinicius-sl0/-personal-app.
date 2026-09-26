import AuthLayout from "@/components/auth-layout";
import { errorCls } from "@/lib/ui";
import ResetForm from "./reset-form";

export const metadata = { title: "Recuperar senha" };

export default async function RecuperarSenhaPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <AuthLayout title="Esqueceu a senha?" description="Informe seu e-mail e enviaremos um link para você criar uma nova senha.">
      {erro === "link" && (
        <p role="alert" className={`${errorCls} mb-5`}>
          Esse link não vale mais (expirou ou já foi usado). Peça um novo abaixo.
        </p>
      )}
      <ResetForm />
    </AuthLayout>
  );
}
