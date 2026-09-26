"use client";

import { useState } from "react";
import TrendChart, { TREND_PERIODS, type TrendPeriod } from "@/components/charts/trend-chart";
import { formatDate, formatValue, type MetricSeries } from "@/lib/assessment";
import { cardCls } from "@/lib/ui";

// Composição corporal em gráficos lado a lado (peso, % gordura, massa muscular...), com um
// único seletor de período para todos. Cada gráfico mostra o valor ao passar o mouse/tocar.
export default function BodyOverview({ series }: { series: MetricSeries[] }) {
  const [period, setPeriod] = useState<TrendPeriod>("all");

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Período dos gráficos" className="flex flex-wrap gap-1">
        {TREND_PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={period === p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              period === p.key ? "bg-brand text-brand-contrast" : "border border-line bg-card text-soft hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {series.map((s) => {
          const last = s.points[s.points.length - 1];
          const first = s.points[0];
          const diff = last.value - first.value;
          return (
            <div key={s.metric.id} className={`${cardCls} p-4`}>
              <p className="text-sm text-muted">{s.metric.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatValue(last.value, s.metric)}</p>
              <p className="mb-3 text-xs text-muted">
                {formatDate(last.date)}
                {s.points.length > 1 && diff !== 0 && ` · ${diff > 0 ? "▲ +" : "▼ −"}${formatValue(Math.abs(diff), s.metric)} desde ${formatDate(first.date)}`}
              </p>
              <TrendChart points={s.points} label={s.metric.label} format={(v) => formatValue(v, s.metric)} height={170} period={period} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
