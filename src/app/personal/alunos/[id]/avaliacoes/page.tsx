import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadSeries } from "@/lib/assessment-data";
import { formatDate } from "@/lib/assessment";
import { btnPrimaryCls, errorCls } from "@/lib/ui";
import EvolutionPanel from "@/components/evolution-panel";

export const metadata = { title: "Avaliações" };

export default async function AvaliacoesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("personal");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: assessments, error }, { series }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("id", id).maybeSingle(),
    supabase
      .from("assessments")
      .select("id, assessed_at, assessment_protocols(name), assessment_values(count)")
      .eq("student_id", id)
      .order("assessed_at", { ascending: false })
      .order("created_at", { ascending: false }),
    loadSeries(supabase, id),
  ]);

  if (!student) notFound();

  return (
    <section className="space-y-4">
      <div>
        <Link href={`/personal/alunos/${id}`} className="text-sm text-zinc-500 underline">
          ← Voltar para {student.full_name}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Avaliações e evolução</h1>
          <Link
            href={`/personal/alunos/${id}/avaliacoes/nova`}
            className={`${btnPrimaryCls} !h-10 !w-auto shrink-0 px-4 text-sm`}
          >
            Nova avaliação
          </Link>
        </div>
      </div>

      {error && <p className={errorCls}>Não foi possível carregar as avaliações: {error.message}</p>}

      <EvolutionPanel series={series} />

      <h2 className="font-semibold">Histórico</h2>
      {!error && assessments?.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhuma avaliação ainda. Clique em “Nova avaliação” para registrar a primeira.
        </p>
      )}
      <ul className="space-y-2">
        {assessments?.map((a) => (
          <li key={a.id}>
            <Link
              href={`/personal/alunos/${id}/avaliacoes/${a.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <span>
                <span className="font-medium">{formatDate(a.assessed_at)}</span>
                {a.assessment_protocols?.name && (
                  <span className="block text-sm text-zinc-500">{a.assessment_protocols.name}</span>
                )}
              </span>
              <span className="shrink-0 text-sm text-zinc-500">
                {a.assessment_values[0]?.count ?? 0} medidas
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
