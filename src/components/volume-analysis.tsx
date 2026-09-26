"use client";

import { useEffect, useRef, useState } from "react";
import { formatRange, formatSets, type MuscleVolume, type Range } from "@/lib/volume";

// Cores validadas (paleta de referência, modos claro e escuro): azul = grupo principal,
// laranja = parte contabilizada como grupo secundário. Texto nunca usa a cor da série.
const FILL_PRIMARY = "fill-[#2a78d6] dark:fill-[#3987e5]";
const FILL_SECONDARY = "fill-[#eb6834] dark:fill-[#d95926]";
const BG_PRIMARY = "bg-[#2a78d6] dark:bg-[#3987e5]";
const BG_SECONDARY = "bg-[#eb6834] dark:bg-[#d95926]";

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

const LABEL_W = 104;
const VALUE_W = 64;
const BAR_H = 18;
const ROW_H = 30;
const GAP = 2;
const RADIUS = 4;

// Retângulo com a ponta direita arredondada (a base, à esquerda, fica reta).
function barPath(x: number, y: number, w: number, h: number, roundEnd: boolean) {
  const r = roundEnd ? Math.min(RADIUS, w / 2, h / 2) : 0;
  return `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`;
}

function BarChart({ rows, unit, decimals }: { rows: Row[]; unit: string; decimals: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasSecondary = rows.some((r) => r.secondary > 0);
  const max = Math.max(...rows.map((r) => r.primary + r.secondary), 0);
  const plotW = width - LABEL_W - VALUE_W;
  const scale = (v: number) => (max > 0 ? (v / max) * plotW : 0);
  const height = rows.length * ROW_H + 4;
  const fmt = (v: number) => `${nf(decimals).format(v)}${unit}`;
  const activeRow = rows.find((r) => r.id === active);
  const activeIndex = rows.findIndex((r) => r.id === active);

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
      <div ref={wrapRef} className="relative" onPointerLeave={() => setActive(null)}>
        <svg width={width} height={height} role="img" aria-label="Volume por grupo muscular" className="block overflow-visible">
          {/* linha de base */}
          <line x1={LABEL_W} x2={LABEL_W} y1={0} y2={height} className="stroke-line-strong" />
          {rows.map((r, i) => {
            const y = i * ROW_H + (ROW_H - BAR_H) / 2 + 2;
            const wP = scale(r.primary);
            const wS = scale(r.secondary);
            const hasS = r.secondary > 0 && wS > 0;
            const total = r.primary + r.secondary;
            const dim = active !== null && active !== r.id;
            return (
              <g
                key={r.id}
                tabIndex={0}
                role="button"
                aria-label={`${r.name}: ${fmt(total)}${hasSecondary ? ` (principal ${fmt(r.primary)}, secundário ${fmt(r.secondary)})` : ""}`}
                onPointerEnter={() => setActive(r.id)}
                onFocus={() => setActive(r.id)}
                onBlur={() => setActive(null)}
                onClick={() => setActive((a) => (a === r.id ? null : r.id))}
                className="cursor-default outline-none"
                opacity={dim ? 0.45 : 1}
              >
                {/* área de toque maior que a barra */}
                <rect x={0} y={i * ROW_H} width={width} height={ROW_H} fill="transparent" />
                <text x={LABEL_W - 8} y={y + BAR_H / 2} dominantBaseline="middle" textAnchor="end" className="fill-strong text-xs">
                  {r.name.length > 15 ? `${r.name.slice(0, 14)}…` : r.name}
                </text>
                {wP > 0 && <path d={barPath(LABEL_W, y, wP, BAR_H, !hasS)} className={FILL_PRIMARY} />}
                {hasS && (
                  <path
                    d={barPath(LABEL_W + wP + (wP > 0 ? GAP : 0), y, Math.max(wS - (wP > 0 ? GAP : 0), 1), BAR_H, true)}
                    className={FILL_SECONDARY}
                  />
                )}
                <text
                  x={LABEL_W + wP + wS + 6}
                  y={y + BAR_H / 2}
                  dominantBaseline="middle"
                  className="fill-brand text-xs font-semibold tabular-nums"
                >
                  {fmt(total)}
                </text>
              </g>
            );
          })}
        </svg>
        {activeRow && hasSecondary && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            style={{ left: LABEL_W, top: Math.max(0, activeIndex * ROW_H - 64) }}
          >
            <p className="font-semibold">{activeRow.name}</p>
            <p className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-sm ${BG_PRIMARY}`} /> Principal: {fmt(activeRow.primary)}
            </p>
            <p className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-sm ${BG_SECONDARY}`} /> Secundário: {fmt(activeRow.secondary)}
            </p>
            <p className="mt-0.5 font-semibold">Total: {fmt(activeRow.primary + activeRow.secondary)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VolumeAnalysis({
  muscles,
  exact,
  frequencyLabel,
  frequencyDivisor = 1,
}: {
  muscles: MuscleVolume[];
  exact: boolean; // realizado = valores exatos; planejado pode ter faixas (8–12 repetições)
  frequencyLabel: string; // ex.: "treino(s) da ficha" (planejado) ou "×/semana" (realizado)
  frequencyDivisor?: number; // nº de semanas do período (para virar média semanal)
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
          <BarChart rows={rows} unit={effective === "kg" ? " kg" : ""} decimals={effective === "series" ? 1 : 0} />
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
              <tr key={m.muscle.id} className="border-t border-line align-top">
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
