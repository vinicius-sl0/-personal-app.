"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import type { Photo } from "@/lib/landing-content";
import { Badge } from "@/components/ui/badge";

type Result = {
  name: string;
  goal: string;
  duration: string;
  description: string;
  before: Photo;
  after: Photo;
  example: boolean;
};

function Shot({ photo, label }: { photo: Photo; label: string }) {
  return (
    <figure className="relative aspect-[3/4] overflow-hidden rounded-xl bg-subtle">
      {photo ? (
        <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 180px, 40vw" className="object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-muted">
          <ImageIcon aria-hidden className="size-7 opacity-60" />
        </div>
      )}
      <figcaption className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
        {label}
      </figcaption>
    </figure>
  );
}

// Carrossel "Resultados reais": rola com o dedo/mouse e também pelos botões (e teclado).
export default function ResultsCarousel({ results }: { results: Result[] }) {
  const track = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 320) + 16), behavior: "smooth" });
  };

  return (
    <div role="region" aria-roledescription="carrossel" aria-label="Resultados de alunos" className="relative">
      <ul
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {results.map((r, i) => (
          <li
            key={i}
            role="group"
            aria-roledescription="item"
            aria-label={`${i + 1} de ${results.length}`}
            className="w-[85%] shrink-0 snap-start sm:w-[60%] lg:w-[calc((100%-2rem)/3)]"
          >
            <article className="h-full rounded-2xl border border-line bg-card p-4">
              <div className="grid grid-cols-2 gap-2">
                <Shot photo={r.before} label="Antes" />
                <Shot photo={r.after} label="Depois" />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{r.goal}</Badge>
                {r.example && <Badge tone="warning">Exemplo</Badge>}
              </div>
              <h3 className="mt-3 font-semibold">{r.name}</h3>
              <p className="text-xs text-muted">{r.duration}</p>
              <p className="mt-2 text-sm text-soft">{r.description}</p>
            </article>
          </li>
        ))}
      </ul>
      {results.length > 1 && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Resultado anterior"
            className="grid size-11 place-items-center rounded-full border border-line-strong bg-card text-ink transition hover:border-brand hover:text-brand-ink"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Próximo resultado"
            className="grid size-11 place-items-center rounded-full border border-line-strong bg-card text-ink transition hover:border-brand hover:text-brand-ink"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
