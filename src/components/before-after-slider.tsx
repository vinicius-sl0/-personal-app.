"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";

// Comparador "Antes x Depois" deslizante: as duas fotos sobrepostas e uma divisória arrastável.
// Por baixo é um <input type="range">: funciona com mouse, toque, teclado e leitor de tela.
export default function BeforeAfterSlider({
  before,
  after,
}: {
  before: { url: string; label: string };
  after: { url: string; label: string };
}) {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md select-none overflow-hidden rounded-2xl border border-line bg-subtle">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after.url} alt={after.label} className="absolute inset-0 size-full object-cover" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before.url}
        alt={before.label}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />

      <span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        Antes
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        Depois
      </span>

      {/* divisória */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgb(0_0_0/0.6)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-brand-contrast shadow-lg">
          <GripVertical className="size-5" />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Arraste para comparar antes e depois"
        aria-valuetext={`${pos}% da foto de antes visível`}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
