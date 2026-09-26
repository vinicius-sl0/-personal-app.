"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, ChartTooltip } from "./chart-parts";

export type SparkPoint = { label: string; value: number };

// Mini gráfico de linha (tendência). Mostra o valor ao passar o mouse/tocar em cada ponto.
export default function Sparkline({
  points,
  ariaLabel,
  format,
  height = 64,
}: {
  points: SparkPoint[];
  ariaLabel: string;
  format: (v: number) => string;
  height?: number;
}) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const pad = (Math.max(...values) - Math.min(...values)) * 0.2 || 1;
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
          <XAxis dataKey="label" hide />
          <YAxis hide domain={[Math.min(...values) - pad, Math.max(...values) + pad]} />
          <Tooltip cursor={{ stroke: "var(--line-strong)" }} content={<ChartTooltip format={format} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART.brand}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART.brand, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
