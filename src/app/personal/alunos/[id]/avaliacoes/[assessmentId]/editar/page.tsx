import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadAssessment, loadMetrics, loadProtocols } from "@/lib/assessment-data";
import { formatDate } from "@/lib/assessment";
import { errorCls } from "@/lib/ui";
import AssessmentForm from "../../assessment-form";
import { updateAssessment } from "../../actions";

export const metadata = { title: "Editar avaliação" };

export default async function EditarAvaliacaoPage({
  params,
}: {
  params: Promise<{ id: string; assessmentId: string }>;
}) {
  await requireRole("personal");
  const { id, assessmentId } = await params;
  const supabase = await createClient();

  const [loaded, { metrics, error }, { protocols }] = await Promise.all([
    loadAssessment(supabase, assessmentId),
    loadMetrics(supabase),
    loadProtocols(supabase),
  ]);
  if (!loaded || loaded.assessment.student_id !== id) notFound();
  const { assessment, values } = loaded;

  // Valores gravados → texto do campo ("78,4"). Calculados não entram: são refeitos ao salvar.
  const calculatedIds = new Set(metrics.filter((m) => m.is_calculated).map((m) => m.id));
  const inputs: Record<string, string> = {};
  for (const v of values) {
    if (calculatedIds.has(v.metric_id)) continue;
    inputs[v.metric_id] =
      v.value_numeric !== null
        ? v.value_numeric.toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: 4 })
        : (v.value_text ?? "");
  }

  return (
    <section className="space-y-4">
      <div>
        <Link
          href={`/personal/alunos/${id}/avaliacoes/${assessmentId}`}
          className="text-sm text-muted underline"
        >
          ← Voltar sem salvar
        </Link>
        <h1 className="mt-2 text-xl font-bold">Editar avaliação de {formatDate(assessment.assessed_at)}</h1>
      </div>

      {error ? (
        <p className={errorCls}>Não foi possível carregar a lista de medidas: {error.message}</p>
      ) : (
        <AssessmentForm
          metrics={metrics}
          protocols={protocols}
          action={updateAssessment.bind(null, id, assessmentId)}
          initial={{
            assessed_at: assessment.assessed_at,
            protocol_id: assessment.protocol_id,
            method: assessment.method,
            device: assessment.device,
            notes: assessment.notes,
            inputs,
          }}
        />
      )}
    </section>
  );
}
