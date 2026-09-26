"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, formatValue, type MetricSeries } from "@/lib/assessment";

const HEIGHT = 200;
const PAD = { top: 20, right: 20, bottom: 28, left: 44 };

// Escolhe marcas "redondas" para o eixo vertical (ex.: 70, 75, 80).
function niceTicks(min: number, max: number, count = 4) {
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1;
    min -= pad;
    max += pad;
  }
  const rough = (max - min) / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = Number(
    ([1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= rough) ?? 10 * mag).toPrecision(6),
  );
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  // Casas decimais = as do próprio passo (0,25 → 2; 5 → 0).
  const decimals = Math.min((String(step).split(".")[1] ?? "").length, 3);
  return { ticks, lo: start, hi: end, decimals };
}

const dayMs = (iso: string) => new Date(`${iso}T00:00:00`).getTime();
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

// Gráfico de linha de UMA métrica ao longo do tempo. Toque/passe o mouse para ver cada valor.
export default function MetricChart({ series }: { series: MetricSeries }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<number | null>(null);
  const { metric, points } = series;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = points.map((p) => p.value);
  const { ticks, lo, hi, decimals } = niceTicks(Math.min(...values), Math.max(...values));
  const t0 = dayMs(points[0].date);
  const t1 = dayMs(points[points.length - 1].date);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const x = (iso: string) => (t1 === t0 ? PAD.left + innerW / 2 : PAD.left + ((dayMs(iso) - t0) / (t1 - t0)) * innerW);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * innerH;

  const xy = points.map((p) => ({ ...p, cx: x(p.date), cy: y(p.value) }));
  const line = xy.map((p, i) => `${i ? "L" : "M"}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(" ");
  const area =
    xy.length > 1
      ? `${line} L${xy[xy.length - 1].cx.toFixed(1)},${PAD.top + innerH} L${xy[0].cx.toFixed(1)},${PAD.top + innerH} Z`
      : "";

  function nearest(clientX: number, rect: DOMRect) {
    const px = ((clientX - rect.left) / rect.width) * width;
    let best = 0;
    for (let i = 1; i < xy.length; i++) {
      if (Math.abs(xy[i].cx - px) < Math.abs(xy[best].cx - px)) best = i;
    }
    return best;
  }

  const shown = active ?? null;
  const last = xy[xy.length - 1];
  const tickLabel = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div ref={wrapRef} className="relative w-full select-none text-zinc-900 dark:text-zinc-100">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Evolução de ${metric.label}: de ${formatValue(points[0].value, metric)} em ${formatDate(points[0].date)} para ${formatValue(last.value, metric)} em ${formatDate(last.date)}. Use as setas para ver cada medição.`}
        tabIndex={0}
        className="touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        onPointerMove={(e) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerDown={(e) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setActive((a) => Math.min(xy.length - 1, (a ?? -1) + 1));
          else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? xy.length) - 1));
          else if (e.key === "Escape") setActive(null);
          else return;
          e.preventDefault();
        }}
      >
        {/* Linhas de grade e valores do eixo vertical */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              strokeWidth={1}
              className="stroke-line"
            />
            <text
              x={PAD.left - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted text-[11px] tabular-nums"
            >
              {tickLabel(t)}
            </text>
          </g>
        ))}

        {/* Datas: primeira e última */}
        <text x={xy[0].cx} y={HEIGHT - 8} textAnchor={xy.length > 1 ? "start" : "middle"} className="fill-muted text-[11px]">
          {shortDate(points[0].date)}
        </text>
        {xy.length > 1 && (
          <text x={last.cx} y={HEIGHT - 8} textAnchor="end" className="fill-muted text-[11px]">
            {shortDate(last.date)}
          </text>
        )}

        {area && <path d={area} fill="currentColor" opacity={0.08} />}
        {xy.length > 1 && (
          <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}

        {shown !== null && (
          <line
            x1={xy[shown].cx}
            x2={xy[shown].cx}
            y1={PAD.top}
            y2={PAD.top + innerH}
            strokeWidth={1}
            className="stroke-zinc-400 dark:stroke-zinc-600"
          />
        )}

        {xy.map((p, i) => (
          <circle
            key={`${p.date}-${i}`}
            cx={p.cx}
            cy={p.cy}
            r={i === shown ? 6 : 4}
            fill="currentColor"
            stroke="var(--background)"
            strokeWidth={2}
          />
        ))}

        {/* Valor mais recente escrito ao lado do último ponto (quando nada está destacado) */}
        {shown === null && (
          <text
            x={last.cx}
            y={last.cy - 12}
            textAnchor={xy.length > 1 ? "end" : "middle"}
            className="fill-brand text-xs font-semibold tabular-nums"
          >
            {formatValue(last.value, metric)}
          </text>
        )}
      </svg>

      {shown !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs shadow-sm dark:bg-zinc-950"
          style={{ left: Math.min(Math.max(xy[shown].cx, 60), width - 60) }}
        >
          <p className="text-muted">{formatDate(xy[shown].date)}</p>
          <p className="font-semibold tabular-nums">{formatValue(xy[shown].value, metric)}</p>
        </div>
      )}
    </div>
  );
}
