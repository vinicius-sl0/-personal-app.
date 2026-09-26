"use client";

// Peças comuns dos gráficos (Recharts): cores por token do tema, dica ao passar o mouse/tocar
// e a tabela equivalente (acessibilidade: os dados nunca dependem só do desenho).

export const CHART = {
  brand: "var(--brand)",
  muted: "var(--muted)",
  grid: "var(--line)",
  axis: "var(--line-strong)",
  secondary: "var(--field)",
};

export const axisTick = { fill: "var(--muted)", fontSize: 11 };

type TooltipPayload = { name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> };

// Dica do gráfico: título em cima, valores em texto (a cor só acompanha como marcador).
export function ChartTooltip({
  active,
  payload,
  label,
  format,
  titleKey,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  format: (v: number) => string;
  titleKey?: string;
}) {
  if (!active || !payload?.length) return null;
  const title = titleKey ? String(payload[0].payload?.[titleKey] ?? label) : label;
  return (
    <div className="rounded-xl border border-line-strong bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-soft">{title}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 font-semibold text-ink">
          <span aria-hidden className="size-2 rounded-sm" style={{ background: p.color ?? CHART.brand }} />
          {payload.length > 1 && <span className="font-normal text-soft">{p.name}:</span>}
          {format(Number(p.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-muted hover:text-ink">Ver em tabela</summary>
      <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-line">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-subtle text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className="px-3 py-1.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                {r.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
