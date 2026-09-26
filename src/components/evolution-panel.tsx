"use client";

import { useState } from "react";
import MetricChart from "@/components/metric-chart";
import { formatDate, formatValue, groupByCategory, type MetricSeries } from "@/lib/assessment";
import { inputCls } from "@/lib/ui";

// Painel de evolução: escolhe uma medida e mostra gráfico + resumo + tabela com todos os valores.
export default function EvolutionPanel({ series }: { series: MetricSeries[] }) {
  const initial = series.find((s) => s.metric.key === "weight_kg") ?? series[0];
  const [metricId, setMetricId] = useState(initial?.metric.id);
  const current = series.find((s) => s.metric.id === metricId) ?? initial;

  if (!current) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
        Os gráficos aparecem aqui depois da primeira avaliação.
      </p>
    );
  }

  const { metric, points } = current;
  const first = points[0];
  const last = points[points.length - 1];
  const diff = last.value - first.value;
  const groups = groupByCategory(series.map((s) => s.metric));

  return (
    <div className="space-y-3 rounded-xl border border-line p-4 bg-card">
      <div className="space-y-1">
        <label htmlFor="evolution-metric" className="text-sm font-medium">
          Medida
        </label>
        <select
          id="evolution-metric"
          value={metric.id}
          onChange={(e) => setMetricId(e.target.value)}
          className={inputCls}
        >
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
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p>
          <span className="text-2xl font-bold tabular-nums">{formatValue(last.value, metric)}</span>{" "}
          <span className="text-sm text-muted">em {formatDate(last.date)}</span>
        </p>
        {points.length > 1 && (
          <p className="text-sm text-muted">
            {diff === 0
              ? "Sem mudança"
              : `${diff > 0 ? "+" : "−"}${formatValue(Math.abs(diff), metric)}`}{" "}
            desde {formatDate(first.date)}
          </p>
        )}
      </div>

      {/* key: ao trocar de medida o gráfico recomeça do zero (sem ponto destacado). */}
      <MetricChart key={metric.id} series={current} />

      {points.length === 1 && (
        <p className="text-sm text-muted">
          Só há uma medição até agora. A linha de evolução aparece a partir da segunda avaliação.
        </p>
      )}

      <details>
        <summary className="cursor-pointer text-sm font-medium">Ver todos os valores</summary>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-normal">Data</th>
              <th className="py-1 text-right font-normal">{metric.label}</th>
            </tr>
          </thead>
          <tbody>
            {points
              .slice()
              .reverse()
              .map((p, i) => (
                <tr key={`${p.date}-${i}`} className="border-t border-zinc-100 dark:border-zinc-900">
                  <td className="py-1.5">{formatDate(p.date)}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatValue(p.value, metric)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
