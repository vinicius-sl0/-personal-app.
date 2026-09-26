"use client";

import { useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { todayIso } from "@/lib/assessment";
import { axisTick, CHART, ChartTooltip, DataTable } from "./chart-parts";

export type TrendPoint = { date: string; value: number }; // date AAAA-MM-DD

const PERIODS = [
  { key: "3m", label: "3 meses", months: 3 },
  { key: "6m", label: "6 meses", months: 6 },
  { key: "12m", label: "1 ano", months: 12 },
  { key: "all", label: "Tudo", months: 0 },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
const fmtShort = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

function monthsAgo(n: number) {
  const d = new Date(`${todayIso()}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 10);
}

// Linha de evolução de UMA medida ao longo do tempo, com escolha de período e dica ao tocar.
// O eixo do tempo é proporcional às datas (avaliações com intervalos diferentes ficam no lugar certo).
export default function TrendChart({
  points,
  label,
  format,
  height = 240,
  showPeriods = true,
  period: controlledPeriod,
}: {
  points: TrendPoint[];
  label: string;
  format: (v: number) => string;
  height?: number;
  showPeriods?: boolean;
  period?: PeriodKey; // quando o período é escolhido fora (vários gráficos juntos)
}) {
  const gradientId = useId().replace(/:/g, "");
  const [ownPeriod, setOwnPeriod] = useState<PeriodKey>("all");
  const period = controlledPeriod ?? ownPeriod;

  const data = useMemo(() => {
    const p = PERIODS.find((x) => x.key === period)!;
    const from = p.months ? monthsAgo(p.months) : "";
    return points
      .filter((pt) => pt.date >= from)
      .map((pt) => ({ ...pt, t: Date.parse(`${pt.date}T00:00:00Z`), title: fmtDate(pt.date) }));
  }, [points, period]);

  const values = data.map((d) => d.value);
  const pad = values.length ? (Math.max(...values) - Math.min(...values)) * 0.15 || Math.abs(values[0]) * 0.05 || 1 : 1;

  return (
    <div>
      {showPeriods && !controlledPeriod && (
        <div role="group" aria-label="Período do gráfico" className="mb-3 flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={period === p.key}
              onClick={() => setOwnPeriod(p.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                period === p.key ? "bg-brand text-brand-contrast" : "bg-subtle text-soft hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {data.length === 0 ? (
        <p className="grid place-items-center rounded-xl border border-dashed border-line-strong text-sm text-muted" style={{ height }}>
          Nenhuma medição neste período.
        </p>
      ) : data.length === 1 ? (
        <p className="grid place-items-center rounded-xl border border-dashed border-line-strong px-4 text-center text-sm text-muted" style={{ height }}>
          Só há uma medição neste período ({format(data[0].value)} em {data[0].title}). A linha aparece a partir da segunda.
        </p>
      ) : (
        <div role="img" aria-label={`Evolução de ${label}`} style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) => fmtShort(new Date(t).toISOString().slice(0, 10))}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: CHART.axis }}
                minTickGap={24}
              />
              <YAxis
                domain={[Math.min(...values) - pad, Math.max(...values) + pad]}
                tickFormatter={(v: number) => format(v).replace(/\s.*$/, "")}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip cursor={{ stroke: "var(--line-strong)" }} content={<ChartTooltip format={format} titleKey="title" />} />
              <Area
                type="monotone"
                dataKey="value"
                name={label}
                stroke={CHART.brand}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={{ r: 3.5, fill: CHART.brand, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "var(--card)", strokeWidth: 2 }}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.length > 0 && (
        <DataTable caption={`Valores de ${label}`} columns={["Data", label]} rows={data.slice().reverse().map((d) => [d.title, format(d.value)])} />
      )}
    </div>
  );
}

export { PERIODS as TREND_PERIODS };
export type { PeriodKey as TrendPeriod };
