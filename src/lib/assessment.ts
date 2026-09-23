// Regras e rótulos da avaliação física, usados tanto no servidor quanto no navegador.
import type { Database } from "@/types/database.types";

export type MetricCategory = Database["public"]["Enums"]["metric_category"];

// Uma métrica do catálogo (assessment_metrics), só com o que as telas usam.
export type Metric = {
  id: string;
  key: string;
  label: string;
  unit: string | null;
  category: MetricCategory;
  value_type: "numeric" | "text";
  min_value: number | null;
  max_value: number | null;
  decimals: number;
  is_calculated: boolean;
  formula_key: string | null;
};

export type Protocol = {
  id: string;
  name: string;
  description: string | null;
  metric_ids: string[];
};

export const METRIC_SELECT =
  "id, key, label, unit, category, value_type, min_value, max_value, decimals, is_calculated, formula_key";

export const CATEGORY_LABEL: Record<MetricCategory, string> = {
  antropometria: "Medidas básicas",
  circunferencia: "Circunferências",
  dobra_cutanea: "Dobras cutâneas",
  composicao_corporal: "Composição corporal",
  desempenho: "Desempenho",
  outro: "Outros indicadores",
};

export const CATEGORY_ORDER: MetricCategory[] = [
  "antropometria",
  "composicao_corporal",
  "circunferencia",
  "dobra_cutanea",
  "desempenho",
  "outro",
];

// Fórmulas das métricas calculadas (formula_key no banco). Cada uma recebe os valores
// lançados, indexados pela key da métrica, e devolve null se faltar algum dado.
type Values = Record<string, number | undefined>;
const FORMULAS: Record<string, (v: Values) => number | null> = {
  bmi: (v) => (v.weight_kg && v.height_cm ? v.weight_kg / (v.height_cm / 100) ** 2 : null),
  whr: (v) => (v.circ_waist && v.circ_hip ? v.circ_waist / v.circ_hip : null),
  fat_mass: (v) =>
    v.weight_kg && v.body_fat_pct !== undefined ? (v.weight_kg * v.body_fat_pct) / 100 : null,
  lean_mass: (v) =>
    v.weight_kg && v.body_fat_pct !== undefined ? v.weight_kg * (1 - v.body_fat_pct / 100) : null,
};

// Explicação curta mostrada ao lado do campo calculado.
export const FORMULA_HINT: Record<string, string> = {
  bmi: "Calculado a partir do peso e da altura.",
  whr: "Calculado a partir da cintura e do quadril.",
  fat_mass: "Calculado a partir do peso e do percentual de gordura.",
  lean_mass: "Calculado a partir do peso e do percentual de gordura.",
};

// Calcula todas as métricas calculadas possíveis. Devolve { metric_id: valor }.
export function computeCalculated(metrics: Metric[], valuesById: Record<string, number>) {
  const byKey: Values = {};
  for (const m of metrics) {
    if (valuesById[m.id] !== undefined) byKey[m.key] = valuesById[m.id];
  }
  const out: Record<string, number> = {};
  for (const m of metrics) {
    if (!m.is_calculated || !m.formula_key) continue;
    const fn = FORMULAS[m.formula_key];
    const result = fn?.(byKey);
    if (result !== null && result !== undefined && Number.isFinite(result)) {
      out[m.id] = roundTo(result, m.decimals);
    }
  }
  return out;
}

export function roundTo(n: number, decimals: number) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// "78,40 kg" → sempre com as casas decimais da métrica, no formato brasileiro.
export function formatValue(value: number, metric: Pick<Metric, "decimals" | "unit">) {
  const num = value.toLocaleString("pt-BR", {
    minimumFractionDigits: metric.decimals,
    maximumFractionDigits: metric.decimals,
  });
  return metric.unit ? `${num} ${metric.unit}` : num;
}

// Data do banco (YYYY-MM-DD) → "22/09/2026", sem risco de mudar de dia por fuso horário.
export function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("pt-BR");
}

// Data de hoje no formato do banco, no fuso do Brasil.
export function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// Organiza métricas por categoria, na ordem de exibição.
export function groupByCategory<T extends Pick<Metric, "category">>(metrics: T[]) {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    metrics: metrics.filter((m) => m.category === category),
  })).filter((g) => g.metrics.length > 0);
}

// Uma linha do gráfico de evolução: todos os valores de uma métrica ao longo do tempo.
export type MetricSeries = {
  metric: Pick<Metric, "id" | "key" | "label" | "unit" | "decimals" | "category">;
  points: { date: string; value: number }[];
};
