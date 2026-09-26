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
      <div>
        <Link href={`/personal/alunos/${id}/avaliacoes`} className="text-sm text-muted underline">
          ← Voltar para as avaliações
        </Link>
        <h1 className="mt-2 text-xl font-bold">Avaliação de {formatDate(assessment.assessed_at)}</h1>
        {assessment.assessment_protocols?.name && (
          <p className="text-sm text-muted">{assessment.assessment_protocols.name}</p>
        )}
      </div>

      {salvo === "1" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
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
