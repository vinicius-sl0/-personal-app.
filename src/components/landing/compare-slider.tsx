"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, MoveHorizontal } from "lucide-react";
import type { Photo } from "@/lib/landing-content";
import s from "./landing.module.css";

function Shot({ photo, priority }: { photo: Photo; priority?: boolean }) {
  if (!photo) {
    return (
      <div className="grid size-full place-items-center bg-subtle text-muted">
        <ImageIcon aria-hidden className="size-8 opacity-60" />
      </div>
    );
  }
  return <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 420px, 90vw" className="object-cover" priority={priority} draggable={false} />;
}

// Antes x Depois da página inicial: as duas fotos sobrepostas e uma divisória arrastável.
// Por baixo é um <input type="range"> que cobre a foto: funciona com mouse, toque (arrastar para
// os lados; rolar a página para cima/baixo continua livre), teclado (setas) e leitor de tela.
// Versão só da landing; o app usa components/before-after-slider.tsx.
export default function CompareSlider({ before, after, label }: { before: Photo; after: Photo; label: string }) {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl border border-line-strong bg-subtle">
      <div className="absolute inset-0">
        <Shot photo={after} />
      </div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Shot photo={before} />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 z-[2] rounded-md bg-black/80 px-2.5 py-1 font-display text-sm font-bold text-white">
        Antes
      </span>
      <span className="pointer-events-none absolute right-3 top-3 z-[2] rounded-md bg-brand px-2.5 py-1 font-display text-sm font-bold text-brand-contrast">
        Depois
      </span>

      {/* divisória */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 z-[2] w-0.5 -translate-x-1/2 bg-white shadow-[0_0_10px_rgb(0_0_0/0.6)]"
        style={{ left: `${pos}%` }}
      >
        <span
          className={`absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-brand-contrast ${s.handle}`}
        >
          <MoveHorizontal className="size-5" />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Arraste para comparar antes e depois: ${label}`}
        aria-valuetext={`${pos}% da foto de antes visível`}
        className="peer absolute inset-0 z-[3] size-full cursor-ew-resize touch-pan-y opacity-0"
      />
      {/* foco do teclado visível em volta da foto */}
      <span aria-hidden className="pointer-events-none absolute inset-0 z-[4] rounded-2xl peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-inset" />
    </div>
  );
}
