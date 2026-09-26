import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadSeries } from "@/lib/assessment-data";
import { formatDate } from "@/lib/assessment";
import { errorCls } from "@/lib/ui";
import EvolutionPanel from "@/components/evolution-panel";

export const metadata = { title: "Minha evolução" };

export default async function MinhasAvaliacoesPage() {
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase.from("students").select("id").maybeSingle();
  if (!student) {
    return <p className={errorCls}>Cadastro de aluno não encontrado.</p>;
  }

  const [{ data: assessments, error }, { series }] = await Promise.all([
    supabase
      .from("assessments")
      .select("id, assessed_at, assessment_protocols(name)")
      .eq("student_id", student.id)
      .order("assessed_at", { ascending: false })
      .order("created_at", { ascending: false }),
    loadSeries(supabase, student.id),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Minha evolução</h1>

      {error && <p className={errorCls}>Não foi possível carregar suas avaliações: {error.message}</p>}

      {!error && assessments?.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          Você ainda não tem avaliações. Quando seu Personal registrar a primeira, ela aparece aqui.
        </p>
      ) : (
        <>
          <EvolutionPanel series={series} />

          <h2 className="font-semibold">Minhas avaliações</h2>
          <ul className="space-y-2">
            {assessments?.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/aluno/avaliacoes/${a.id}`}
                  className="block rounded-xl border border-line p-4 hover:bg-subtle bg-card"
                >
                  <span className="font-medium">{formatDate(a.assessed_at)}</span>
                  {a.assessment_protocols?.name && (
                    <span className="block text-sm text-muted">{a.assessment_protocols.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
