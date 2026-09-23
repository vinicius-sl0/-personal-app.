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
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
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
                  className="block rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">{formatDate(a.assessed_at)}</span>
                  {a.assessment_protocols?.name && (
                    <span className="block text-sm text-zinc-500">{a.assessment_protocols.name}</span>
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
