import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMinor } from "@/lib/utils";
import { btnPrimaryCls } from "@/lib/ui";
import TermsForm from "./terms-form";

export const metadata = { title: "Meu painel" };

export default async function AlunoHome() {
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase
    .from("students")
    .select("status, birth_date")
    .maybeSingle();

  if (student?.status === "convidado") {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-bold">Falta pouco</h1>
        <p className="text-sm text-zinc-500">
          Para liberar seu acesso, aceite os consentimentos abaixo.
        </p>
        <TermsForm minor={isMinor(student.birth_date)} />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Meu painel</h1>
      <Link href="/aluno/treinos" className={btnPrimaryCls}>
        Ver meus treinos
      </Link>
      <p className="text-sm text-zinc-500">
        Em breve: suas avaliações e a conversa com o Personal.
      </p>
    </section>
  );
}
