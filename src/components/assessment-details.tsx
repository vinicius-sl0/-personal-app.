import { formatValue, groupByCategory, type Metric } from "@/lib/assessment";

// Mostra os valores de uma avaliação agrupados por categoria (usado pelo Personal e pelo aluno).
export default function AssessmentDetails({
  metrics,
  values,
  method,
  device,
  notes,
}: {
  metrics: Metric[];
  values: { metric_id: string; value_numeric: number | null; value_text: string | null }[];
  method: string | null;
  device: string | null;
  notes: string | null;
}) {
  const byId = new Map(values.map((v) => [v.metric_id, v]));
  const groups = groupByCategory(metrics.filter((m) => byId.has(m.id)));

  return (
    <div className="space-y-4">
      {groups.length === 0 && <p className="text-sm text-muted">Nenhuma medida registrada.</p>}

      {groups.map((g) => (
        <div key={g.category} className="rounded-xl border border-line p-4 bg-card">
          <h2 className="mb-2 font-semibold">{g.label}</h2>
          <dl className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {g.metrics.map((m) => {
              const v = byId.get(m.id)!;
              return (
                <div key={m.id} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                  <dt className="text-soft">
                    {m.label}
                    {m.is_calculated && <span className="text-xs text-muted"> (calculado)</span>}
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {v.value_numeric !== null ? formatValue(v.value_numeric, m) : v.value_text}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}

      {(method || device || notes) && (
        <div className="space-y-1 rounded-xl border border-line p-4 text-sm bg-card">
          <h2 className="mb-1 font-semibold">Observações</h2>
          {method && <p>Método: {method}</p>}
          {device && <p>Aparelho: {device}</p>}
          {notes && <p className="whitespace-pre-line">{notes}</p>}
        </div>
      )}
    </div>
  );
}
