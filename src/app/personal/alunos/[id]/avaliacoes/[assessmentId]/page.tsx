import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadAssessment } from "@/lib/assessment-data";
import { formatDate } from "@/lib/assessment";
import { btnPrimaryCls } from "@/lib/ui";
import AssessmentDetails from "@/components/assessment-details";
import DeleteAssessmentButton from "../delete-button";
import { deleteAssessment } from "../actions";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Avaliação" };

export default async function AvaliacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; assessmentId: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  await requireRole("personal");
  const { id, assessmentId } = await params;
  const { salvo } = await searchParams;
  const supabase = await createClient();

  const loaded = await loadAssessment(supabase, assessmentId);
  if (!loaded || loaded.assessment.student_id !== id) notFound();
  const { assessment, metrics, values } = loaded;

  return (
    <section className="space-y-4">
      <PageHeader back={{ href: `/personal/alunos/${id}/avaliacoes`, label: "Voltar para as avaliações" }} title={<>Avaliação de {formatDate(assessment.assessed_at)}</>} description={assessment.assessment_protocols?.name} />

      {salvo === "1" && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-3 py-2 text-sm">
          Avaliação salva.
        </p>
      )}

      <AssessmentDetails
        metrics={metrics}
        values={values}
        method={assessment.method}
        device={assessment.device}
        notes={assessment.notes}
      />

      <Link href={`/personal/alunos/${id}/avaliacoes/${assessmentId}/editar`} className={btnPrimaryCls}>
        Editar avaliação
      </Link>
      <DeleteAssessmentButton action={deleteAssessment.bind(null, id, assessmentId)} />
    </section>
  );
}
