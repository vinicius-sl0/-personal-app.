import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadAssessment } from "@/lib/assessment-data";
import { formatDate } from "@/lib/assessment";
import AssessmentDetails from "@/components/assessment-details";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader back={{ href: "/aluno/avaliacoes", label: "Voltar para minha evolução" }} title={<>Avaliação de {formatDate(assessment.assessed_at)}</>} description={assessment.assessment_protocols?.name} />

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
