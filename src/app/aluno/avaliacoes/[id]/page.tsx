import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadAssessment } from "@/lib/assessment-data";
import { formatDate } from "@/lib/assessment";
import AssessmentDetails from "@/components/assessment-details";

export const metadata = { title: "Avaliação" };

export default async function MinhaAvaliacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // A RLS só devolve avaliações do próprio aluno; de outra pessoa, vem vazio → 404.
  const loaded = await loadAssessment(supabase, id);
  if (!loaded) notFound();
  const { assessment, metrics, values } = loaded;

  return (
    <section className="space-y-4">
      <div>
        <Link href="/aluno/avaliacoes" className="text-sm text-muted underline">
          ← Voltar para minha evolução
        </Link>
        <h1 className="mt-2 text-xl font-bold">Avaliação de {formatDate(assessment.assessed_at)}</h1>
        {assessment.assessment_protocols?.name && (
          <p className="text-sm text-muted">{assessment.assessment_protocols.name}</p>
        )}
      </div>

      <AssessmentDetails
        metrics={metrics}
        values={values}
        method={assessment.method}
        device={assessment.device}
        notes={assessment.notes}
      />
    </section>
  );
}
