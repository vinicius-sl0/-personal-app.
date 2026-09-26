import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMinor } from "@/lib/utils";
import { btnPrimaryCls, btnSecondaryCls } from "@/lib/ui";
import { currentWeekStart } from "@/lib/feedback";
import TermsForm from "./terms-form";

export const metadata = { title: "Meu painel" };

export default async function AlunoHome() {
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase
    .from("students")
    .select("id, status, birth_date")
    .maybeSingle();

  if (student?.status === "convidado") {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-bold">Falta pouco</h1>
        <p className="text-sm text-muted">
          Para liberar seu acesso, aceite os consentimentos abaixo.
        </p>
        <TermsForm minor={isMinor(student.birth_date)} />
      </section>
    );
  }

  // Feedback desta semana ainda não enviado? Mostra um lembrete no topo.
  const { count: feedbacksThisWeek } = student
    ? await supabase
        .from("weekly_checkins")
        .select("id", { count: "exact", head: true })
        .eq("student_id", student.id)
        .eq("week_start", currentWeekStart())
    : { count: null };
  const feedbackPending = student?.status === "ativo" && feedbacksThisWeek === 0;

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Meu painel</h1>
      {feedbackPending && (
        <Link
          href="/aluno/feedback"
          className="block rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <span className="font-semibold">Feedback da semana pendente.</span> Conte como foi sua semana
          para o seu Personal →
        </Link>
      )}
      <Link href="/aluno/treinos" className={btnPrimaryCls}>
        Ver meus treinos
      </Link>
      <Link href="/aluno/treinos/historico" className={btnSecondaryCls}>
        Minha frequência
      </Link>
      <Link href="/aluno/avaliacoes" className={btnSecondaryCls}>
        Ver minha evolução
      </Link>
      <Link href="/aluno/fotos" className={btnSecondaryCls}>
        Fotos de evolução
      </Link>
      <Link href="/aluno/mensagens" className={btnSecondaryCls}>
        Conversar com o Personal
      </Link>
    </section>
  );
}
