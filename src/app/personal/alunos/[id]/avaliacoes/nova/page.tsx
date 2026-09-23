import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadMetrics, loadProtocols, loadSeries } from "@/lib/assessment-data";
import { errorCls } from "@/lib/ui";
import AssessmentForm from "../assessment-form";
import { createAssessment } from "../actions";

export const metadata = { title: "Nova avaliação" };

export default async function NovaAvaliacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("personal");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { metrics, error }, { protocols }, { series }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("id", id).maybeSingle(),
    loadMetrics(supabase),
    loadProtocols(supabase),
    loadSeries(supabase, id),
  ]);

  if (!student) notFound();

  // Último valor de cada medida, mostrado como referência embaixo do campo.
  const previous = Object.fromEntries(
    series.map((s) => [s.metric.id, s.points[s.points.length - 1]]),
  );

  // Altura de adulto quase não muda: já vem preenchida com a última medida (pode ser alterada).
  const height = series.find((s) => s.metric.key === "height_cm");
  const inputs: Record<string, string> = {};
  if (height) {
    const last = height.points[height.points.length - 1].value;
    inputs[height.metric.id] = last.toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: 4 });
  }

  return (
    <section className="space-y-4">
      <div>
        <Link href={`/personal/alunos/${id}/avaliacoes`} className="text-sm text-zinc-500 underline">
          ← Voltar para as avaliações
        </Link>
        <h1 className="mt-2 text-xl font-bold">Nova avaliação de {student.full_name}</h1>
      </div>

      {error ? (
        <p className={errorCls}>Não foi possível carregar a lista de medidas: {error.message}</p>
      ) : (
        <AssessmentForm
          metrics={metrics}
          protocols={protocols}
          action={createAssessment.bind(null, id)}
          previous={previous}
          prefill={inputs}
        />
      )}
    </section>
  );
}
