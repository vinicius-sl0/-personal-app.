import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { METRIC_SELECT, type Metric, type MetricSeries, type Protocol } from "@/lib/assessment";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Catálogo de métricas visíveis para quem está logado (a RLS filtra: globais + do Personal).
// activeOnly=false inclui métricas desativadas, para ainda exibir valores antigos.
export async function loadMetrics(supabase: Supabase, { activeOnly = true } = {}) {
  let query = supabase.from("assessment_metrics").select(METRIC_SELECT).order("sort_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  return { metrics: (data ?? []) as Metric[], error };
}

export async function loadProtocols(supabase: Supabase) {
  const { data, error } = await supabase
    .from("assessment_protocols")
    .select("id, name, description, assessment_protocol_metrics(metric_id, position)")
    .eq("is_active", true)
    .order("name");

  const protocols: Protocol[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    metric_ids: (p.assessment_protocol_metrics ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((pm) => pm.metric_id),
  }));
  return { protocols, error };
}

// Uma avaliação com seus valores. A RLS garante que só o Personal do aluno ou o próprio aluno leiam.
export async function loadAssessment(supabase: Supabase, assessmentId: string) {
  const [{ data: assessment }, { data: values }, { metrics }] = await Promise.all([
    supabase
      .from("assessments")
      .select("id, student_id, protocol_id, assessed_at, method, device, notes, assessment_protocols(name)")
      .eq("id", assessmentId)
      .maybeSingle(),
    supabase
      .from("assessment_values")
      .select("metric_id, value_numeric, value_text")
      .eq("assessment_id", assessmentId),
    loadMetrics(supabase, { activeOnly: false }),
  ]);
  if (!assessment) return null;
  return {
    assessment,
    metrics,
    values: (values ?? []).map((v) => ({
      metric_id: v.metric_id,
      value_numeric: v.value_numeric === null ? null : Number(v.value_numeric),
      value_text: v.value_text,
    })),
  };
}

// Série histórica de cada métrica do aluno, para os gráficos. A view já respeita a RLS.
export async function loadSeries(supabase: Supabase, studentId: string) {
  const [{ data, error }, { metrics }] = await Promise.all([
    supabase
      .from("v_student_metric_series")
      .select("metric_id, assessed_at, value_numeric")
      .eq("student_id", studentId)
      .order("assessed_at"),
    loadMetrics(supabase, { activeOnly: false }),
  ]);

  const byId = new Map<string, MetricSeries>();
  for (const m of metrics) byId.set(m.id, { metric: m, points: [] });
  for (const row of data ?? []) {
    if (!row.metric_id || !row.assessed_at || row.value_numeric === null) continue;
    byId.get(row.metric_id)?.points.push({ date: row.assessed_at, value: Number(row.value_numeric) });
  }

  // Mantém a ordem do catálogo e descarta métricas nunca medidas.
  const series = metrics.map((m) => byId.get(m.id)!).filter((s) => s.points.length > 0);
  return { series, error };
}
