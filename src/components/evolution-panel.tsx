"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import TrendChart from "@/components/charts/trend-chart";
import { formatDate, formatValue, groupByCategory, type MetricSeries } from "@/lib/assessment";
import { cardCls, inputCls } from "@/lib/ui";
import { EmptyState } from "@/components/ui/states";

// Painel de evolução: escolhe uma medida e mostra resumo + gráfico interativo (com período) + tabela.
export default function EvolutionPanel({ series, initialKey = "weight_kg" }: { series: MetricSeries[]; initialKey?: string }) {
  const initial = series.find((s) => s.metric.key === initialKey) ?? series[0];
  const [metricId, setMetricId] = useState(initial?.metric.id);
  const current = series.find((s) => s.metric.id === metricId) ?? initial;

  if (!current) {
    return (
      <EmptyState
        icon={<TrendingUp className="size-5" />}
        title="Ainda sem gráficos"
        description="Os gráficos de evolução aparecem aqui depois da primeira avaliação."
      />
    );
  }

  const { metric, points } = current;
  const first = points[0];
  const last = points[points.length - 1];
  const diff = last.value - first.value;
  const groups = groupByCategory(series.map((s) => s.metric));

  return (
    <div className={`${cardCls} space-y-4 p-4 sm:p-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block space-y-1.5 sm:w-72">
          <span className="text-sm font-medium text-strong">Medida</span>
          <select value={metric.id} onChange={(e) => setMetricId(e.target.value)} className={inputCls}>
            {groups.map((g) => (
              <optgroup key={g.category} label={g.label}>
                {g.metrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="sm:text-right">
          <p className="text-3xl font-bold tabular-nums">{formatValue(last.value, metric)}</p>
          <p className="text-sm text-muted">
            em {formatDate(last.date)}
            {points.length > 1 && (
              <>
                {" · "}
                {diff === 0 ? "sem mudança" : `${diff > 0 ? "▲ +" : "▼ −"}${formatValue(Math.abs(diff), metric)}`} desde {formatDate(first.date)}
              </>
            )}
          </p>
        </div>
      </div>

      {/* key: ao trocar de medida o gráfico recomeça do zero. */}
      <TrendChart key={metric.id} points={points} label={metric.label} format={(v) => formatValue(v, metric)} />
    </div>
  );
}
