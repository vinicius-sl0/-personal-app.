import { getValidInvite } from "@/lib/invite";
import { isMinor } from "@/lib/utils";
import AcceptForm from "./accept-form";

export const metadata = { title: "Ativar conta" };

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getValidInvite(token);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      {invite ? (
        <>
          <h1 className="text-2xl font-bold">Olá, {invite.student.full_name.split(" ")[0]}!</h1>
          <p className="mt-1 mb-6 text-sm text-zinc-500">
            Crie sua senha e aceite os termos para acessar seus treinos.
          </p>
          <AcceptForm
            token={token}
            email={invite.student.email}
            minor={isMinor(invite.student.birth_date)}
          />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Convite indisponível</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Este link é inválido, já foi usado ou expirou. Peça um novo convite ao seu Personal.
          </p>
        </>
      )}
    </main>
  );
}
