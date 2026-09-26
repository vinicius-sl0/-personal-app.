"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import ColumnChart from "@/components/charts/column-chart";
import { cardCls } from "@/lib/ui";

export type TrendRow = {
  key: string;
  label: string; // rótulo curto no eixo
  title: string; // rótulo completo na dica/tabela
  sets: number;
  reps: number;
  load: number;
  kcal: number;
  sessions: number;
};

const nf = (d: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d });

const METRICS = [
  { key: "sets", label: "Séries", unit: "Séries", format: (v: number) => nf(1).format(v) },
  { key: "reps", label: "Repetições", unit: "Repetições", format: (v: number) => nf(0).format(v) },
  { key: "load", label: "Volume (kg)", unit: "Volume de carga", format: (v: number) => `${nf(0).format(v)} kg` },
  { key: "kcal", label: "Calorias ≈", unit: "Calorias estimadas", format: (v: number) => `≈ ${nf(0).format(v)} kcal` },
  { key: "sessions", label: "Treinos", unit: "Treinos", format: (v: number) => nf(0).format(v) },
] as const;
type MetricKey = (typeof METRICS)[number]["key"];

// Evolução do volume REALIZADO por semana ou por mês, com escolha da medida.
export default function VolumeTrends({
  weekly,
  monthly,
  subject,
  muscleFiltered,
  initialMetric = "sets",
  title,
}: {
  weekly: TrendRow[];
  monthly: TrendRow[];
  subject: string; // "todos os grupos" ou o nome do grupo filtrado
  muscleFiltered: boolean;
  initialMetric?: "sets" | "reps" | "load" | "kcal" | "sessions";
  title?: string; // título do card (padrão: "Evolução semanal/mensal")
}) {
  const [scale, setScale] = useState<"semanal" | "mensal">("semanal");
  const [metric, setMetric] = useState<MetricKey>(initialMetric);
  const rows = scale === "semanal" ? weekly : monthly;
  const m = METRICS.find((x) => x.key === metric)!;
  const total = rows.reduce((n, r) => n + r[metric], 0);
  const perGroup = muscleFiltered && (metric === "sets" || metric === "reps" || metric === "load");

  return (
    <div className={`${cardCls} space-y-4 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand-ink">
            <TrendingUp className="size-4" />
          </span>
          <div>
            <h3 className="font-semibold">{title ?? `Evolução ${scale === "semanal" ? "semanal" : "mensal"}`}</h3>
            <p className="text-sm text-muted">
              {m.unit} · {perGroup ? subject : "todos os treinos"} · {scale === "semanal" ? "últimas 26 semanas" : "últimos 6 meses"}
            </p>
          </div>
        </div>
        <div role="group" aria-label="Agrupar por" className="flex gap-1 rounded-xl border border-line p-1">
          {(["semanal", "mensal"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={scale === k}
              onClick={() => setScale(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${scale === k ? "bg-brand text-brand-contrast" : "text-soft hover:text-ink"}`}
            >
              {k === "semanal" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Medida" className="flex flex-wrap gap-1.5">
        {METRICS.map((x) => (
          <button
            key={x.key}
            type="button"
            aria-pressed={metric === x.key}
            onClick={() => setMetric(x.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              metric === x.key ? "border-brand bg-brand-soft text-ink" : "border-line text-soft hover:border-line-strong"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <p className="text-sm">
        Total no gráfico: <strong className="tabular-nums">{m.format(total)}</strong>
      </p>
      <ColumnChart
        data={rows.map((r) => ({ label: r.label, title: r.title, value: r[metric] }))}
        ariaLabel={`${m.unit} por ${scale === "semanal" ? "semana" : "mês"}`}
        unit={m.unit}
        xLabel={scale === "semanal" ? "Semana" : "Mês"}
        format={m.format}
      />
      {metric === "kcal" && (
        <p className="text-xs text-muted">Calorias estimadas: aproximação a partir da duração dos treinos e do kcal/min cadastrado — não é medição.</p>
      )}
      {muscleFiltered && !perGroup && <p className="text-xs text-muted">Calorias e treinos são do treino inteiro (não dá para separar por grupo muscular).</p>}
    </div>
  );
}
