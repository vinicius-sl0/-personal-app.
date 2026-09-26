"use client";

import { useState } from "react";
import { Bar, BarChart as RBarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRange, formatSets, type MuscleVolume, type Range } from "@/lib/volume";
import { axisTick, CHART } from "@/components/charts/chart-parts";

// Cores validadas (skill dataviz, claro e escuro): laranja = grupo principal,
// azul = parte contabilizada como grupo secundário. Texto nunca usa a cor da série.
const BG_PRIMARY = "bg-[var(--chart-1)]";
const BG_SECONDARY = "bg-[var(--chart-2)]";

type Metric = "series" | "reps" | "kg";
const METRICS: { value: Metric; label: string }[] = [
  { value: "series", label: "Séries" },
  { value: "reps", label: "Repetições" },
  { value: "kg", label: "Volume de carga" },
];

const nf = (d: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d });
const sub = (a: Range, b: Range): Range => ({ min: a.min - b.min, max: a.max - b.max });

type Row = { id: string; name: string; primary: number; secondary: number };

function rowsFor(muscles: MuscleVolume[], metric: Metric): Row[] {
  return muscles
    .map((m) => {
      if (metric === "series") {
        return { id: m.muscle.id, name: m.muscle.name, primary: m.directSets, secondary: m.countedSets - m.directSets };
      }
      // Realizado: valores exatos (min = max).
      const total = metric === "reps" ? m.reps : m.loadVolume;
      const direct = metric === "reps" ? m.directReps : m.directLoadVolume;
      return { id: m.muscle.id, name: m.muscle.name, primary: direct.max, secondary: sub(total, direct).max };
    })
    .filter((r) => r.primary + r.secondary > 0)
    .sort((a, b) => b.primary + b.secondary - (a.primary + a.secondary));
}

// Barras horizontais empilhadas (principal + secundário) por grupo muscular. Interativo.
function BarChart({ rows, unit, decimals, selectedId }: { rows: Row[]; unit: string; decimals: number; selectedId?: string | null }) {
  const hasSecondary = rows.some((r) => r.secondary > 0);
  const fmt = (v: number) => `${nf(decimals).format(v)}${unit}`;
  const data = rows.map((r) => ({ ...r, total: r.primary + r.secondary }));
  const dim = (id: string) => (selectedId && selectedId !== id ? 0.3 : 1);

  return (
    <div className="space-y-2">
      {hasSecondary && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-soft">
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-sm ${BG_PRIMARY}`} /> Grupo principal
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-sm ${BG_SECONDARY}`} /> Como grupo secundário (contabilizado)
          </span>
        </div>
      )}
      <div role="img" aria-label="Volume por grupo muscular" style={{ height: rows.length * 34 + 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 0, left: 0 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} stroke={CHART.grid} strokeDasharray="3 3" />
            <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => nf(0).format(v)} />
            <YAxis type="category" dataKey="name" width={112} tick={{ ...axisTick, fill: "var(--soft)", fontSize: 12 }} tickLine={false} axisLine={{ stroke: CHART.axis }} />
            <Tooltip
              cursor={{ fill: "var(--subtle)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as Row;
                return (
                  <div className="rounded-xl border border-line-strong bg-card px-3 py-2 text-xs shadow-lg">
                    <p className="mb-1 font-semibold">{r.name}</p>
                    <p className="flex items-center gap-1.5 text-soft">
                      <span className={`inline-block size-2 rounded-sm ${BG_PRIMARY}`} /> Principal: <strong className="text-ink">{fmt(r.primary)}</strong>
                    </p>
                    {hasSecondary && (
                      <p className="flex items-center gap-1.5 text-soft">
                        <span className={`inline-block size-2 rounded-sm ${BG_SECONDARY}`} /> Secundário: <strong className="text-ink">{fmt(r.secondary)}</strong>
                      </p>
                    )}
                    <p className="mt-0.5 font-semibold text-ink">Total: {fmt(r.primary + r.secondary)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="primary" name="Principal" stackId="v" fill={CHART.brand} radius={hasSecondary ? 0 : [0, 4, 4, 0]} maxBarSize={22} animationDuration={500}>
              {data.map((r) => (
                <Cell key={r.id} fillOpacity={dim(r.id)} />
              ))}
              {!hasSecondary && (
                <LabelList dataKey="total" position="right" fill="var(--ink)" fontSize={11} fontWeight={600} formatter={(v) => fmt(Number(v))} />
              )}
            </Bar>
            {hasSecondary && (
              <Bar
                dataKey="secondary"
                name="Secundário"
                stackId="v"
                fill={CHART.series2}
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                animationDuration={500}
              >
                {data.map((r) => (
                  <Cell key={r.id} fillOpacity={dim(r.id)} />
                ))}
                <LabelList dataKey="total" position="right" fill="var(--ink)" fontSize={11} fontWeight={600} formatter={(v) => fmt(Number(v))} />
              </Bar>
            )}
          </RBarChart>
        </ResponsiveContainer>
      </div>
      {/* valores diretos, em texto (não dependem só do desenho) */}
      <p className="sr-only">
        {data.map((r) => `${r.name}: ${fmt(r.total)}`).join("; ")}
      </p>
    </div>
  );
}

export default function VolumeAnalysis({
  muscles,
  exact,
  frequencyLabel,
  frequencyDivisor = 1,
  selectedMuscleId,
}: {
  muscles: MuscleVolume[];
  exact: boolean; // realizado = valores exatos; planejado pode ter faixas (8–12 repetições)
  frequencyLabel: string; // ex.: "treino(s) da ficha" (planejado) ou "×/semana" (realizado)
  frequencyDivisor?: number; // nº de semanas do período (para virar média semanal)
  selectedMuscleId?: string | null; // grupo filtrado: destacado no gráfico e na tabela
}) {
  const [metric, setMetric] = useState<Metric>("series");
  const effective: Metric = exact ? metric : "series";
  const rows = rowsFor(muscles, effective);

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-line p-4 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Volume por grupo muscular</h3>
          {exact && (
            <div role="group" aria-label="Medida do gráfico" className="flex gap-1 rounded-lg border border-line p-0.5">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={metric === m.value}
                  onClick={() => setMetric(m.value)}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    metric === m.value ? "bg-brand text-brand-contrast" : "text-soft"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {!exact && (
          <p className="text-xs text-muted">
            Gráfico em séries. Repetições e carga da ficha podem ser faixas (ex.: 8–12), por isso aparecem só na tabela.
          </p>
        )}
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Sem dados para mostrar.</p>
        ) : (
          <BarChart rows={rows} unit={effective === "kg" ? " kg" : ""} decimals={effective === "series" ? 1 : 0} selectedId={selectedMuscleId} />
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-subtle text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Grupo</th>
              <th scope="col" className="px-3 py-2 font-medium">Séries</th>
              <th scope="col" className="px-3 py-2 font-medium">Exercícios</th>
              <th scope="col" className="px-3 py-2 font-medium">Repetições</th>
              <th scope="col" className="px-3 py-2 font-medium">Volume de carga</th>
              <th scope="col" className="px-3 py-2 font-medium">Frequência</th>
            </tr>
          </thead>
          <tbody>
            {muscles.map((m) => (
              <tr key={m.muscle.id} className={`border-t border-line align-top ${selectedMuscleId === m.muscle.id ? "bg-brand-soft" : ""}`}>
                <th scope="row" className="px-3 py-2 font-medium">{m.muscle.name}</th>
                <td className="px-3 py-2 tabular-nums">
                  <span className="font-semibold">{formatSets(m.countedSets)}</span>
                  {m.indirectSets > 0 && (
                    <span className="block text-xs text-muted">
                      {formatSets(m.directSets)} principal + {formatSets(m.countedSets - m.directSets)} secundário
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">{m.exercises}</td>
                <td className="px-3 py-2 tabular-nums">
                  {formatRange(m.reps)}
                  {m.setsWithoutReps > 0 && (
                    <span className="block text-xs text-muted">{formatSets(m.setsWithoutReps)} séries sem número</span>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatRange(m.loadVolume, "kg")}
                  {m.setsWithoutLoad > 0 && (
                    <span className="block text-xs text-muted">{formatSets(m.setsWithoutLoad)} séries sem carga</span>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {nf(1).format(m.frequency / Math.max(frequencyDivisor, 1))} {frequencyLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
