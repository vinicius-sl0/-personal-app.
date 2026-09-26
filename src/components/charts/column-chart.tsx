"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, CHART, ChartTooltip, DataTable } from "./chart-parts";

export type ColumnDatum = { label: string; title: string; value: number };

// Colunas de uma única série (ex.: treinos concluídos por dia). Interativo: dica ao passar/tocar.
export default function ColumnChart({
  data,
  ariaLabel,
  unit,
  height = 220,
  format = (v) => String(v),
}: {
  data: ColumnDatum[];
  ariaLabel: string;
  unit: string; // para a tabela, ex.: "Treinos"
  height?: number;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div role="img" aria-label={ariaLabel} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: CHART.axis }} interval="preserveStartEnd" minTickGap={12} />
            <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              cursor={{ fill: "var(--subtle)" }}
              content={<ChartTooltip format={format} titleKey="title" />}
            />
            <Bar dataKey="value" name={unit} fill={CHART.brand} radius={[4, 4, 0, 0]} maxBarSize={24} animationDuration={500} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={ariaLabel} columns={["Dia", unit]} rows={data.map((d) => [d.title, format(d.value)])} />
    </div>
  );
}
