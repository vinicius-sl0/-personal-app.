import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { getValidInvite } from "@/lib/invite";
import { BRAND } from "@/lib/brand";
import { btnSecondaryCls } from "@/lib/ui";
import { BrandMark } from "@/components/brand-mark";
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
      <p className="mb-8 flex items-center gap-2.5">
        <BrandMark size="md" />
        <span className="font-display font-semibold">{BRAND.name}</span>
      </p>
      {invite ? (
        <>
          <h1 className="text-2xl font-bold">Olá, {invite.student.full_name.split(" ")[0]}!</h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Crie sua senha e aceite os termos para acessar seus treinos.
          </p>
          <AcceptForm
            token={token}
            email={invite.student.email}
            minor={isMinor(invite.student.birth_date)}
          />
        </>
      ) : (
        <div className="space-y-4">
          <span aria-hidden className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
            <LinkIcon className="size-7" />
          </span>
          <h1 className="text-2xl font-bold">Convite indisponível</h1>
          <p className="text-sm text-muted">
            Este link é inválido, já foi usado ou expirou. Peça um novo convite ao seu Personal. Se você já ativou sua
            conta, é só entrar.
          </p>
          <Link href="/login" className={`${btnSecondaryCls} w-full`}>
            Entrar
          </Link>
        </div>
      )}
    </main>
  );
}
