import { displayNumberCls } from "@/lib/ui";

export type ScoreItem = { label: string; value: string; sub?: string };

// Placar: vários números lado a lado num único painel, separados por linhas finas cromadas
// (em vez de um cartão para cada número). Usado nos totais da Análise de volume e das calorias.
export function Scoreboard({ items, label }: { items: ScoreItem[]; label: string }) {
  const cols = items.length >= 4 ? "sm:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <dl
      aria-label={label}
      className={`grid grid-cols-2 ${cols} gap-px overflow-hidden rounded-2xl border border-line bg-chrome/25`}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          // número ímpar de itens: no celular (2 colunas) o último ocupa a linha inteira
          className={`flex flex-col bg-card px-4 py-3.5 sm:px-5 sm:py-4 ${
            items.length % 2 === 1 && i === items.length - 1 ? "col-span-2 sm:col-span-1" : ""
          }`}
        >
          <dt className="order-2 mt-1 text-sm text-soft">{it.label}</dt>
          <dd className={`order-1 text-2xl leading-none sm:text-[1.75rem] ${displayNumberCls}`}>{it.value}</dd>
          {it.sub && <dd className="order-3 mt-0.5 text-xs text-muted">{it.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}
