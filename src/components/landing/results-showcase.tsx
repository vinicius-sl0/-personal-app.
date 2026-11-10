"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import type { Photo } from "@/lib/landing-content";
import { ExampleTag } from "@/components/landing/example-tag";
import CompareSlider from "@/components/landing/compare-slider";
import s from "./landing.module.css";

type Result = {
  name: string;
  goal: string;
  duration: string;
  description: string;
  before: Photo;
  after: Photo;
  example: boolean;
};

const arrowCls =
  "grid size-12 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-[border-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-brand hover:text-brand-ink disabled:pointer-events-none disabled:opacity-30";

// "Resultados que falam por si": um resultado por vez, com o comparador de arrastar. Troca pelas
// setas, pelos pontinhos ou pelas miniaturas. Não passa sozinho, de propósito: atrapalharia quem
// está arrastando a divisória.
export default function ResultsShowcase({ results }: { results: Result[] }) {
  const [index, setIndex] = useState(0);
  const total = results.length;
  const r = results[index];
  const go = (i: number) => setIndex((i + total) % total);
  const label = `resultado ${index + 1} de ${total}`;

  return (
    <div
      role="group"
      aria-roledescription="carrossel"
      aria-label="Resultados de alunos"
      className="grid items-center gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16"
    >
      {/* key: ao trocar de resultado, a divisória volta ao meio e a troca entra suave */}
      <div key={index} className={`mx-auto w-full max-w-[26rem] ${s.fadeSwap}`}>
        <CompareSlider before={r.before} after={r.after} label={label} />
      </div>

      <div className="min-w-0">
        <p aria-live="polite" className="font-display text-sm font-semibold tabular-nums text-muted">
          <span className="text-brand-ink">{String(index + 1).padStart(2, "0")}</span> / {String(total).padStart(2, "0")}
        </p>

        <div key={`t${index}`} className={s.fadeSwap}>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand/40 bg-brand-soft px-3 py-1 font-display text-sm font-semibold text-brand-ink">
              {r.goal}
            </span>
            <span className="rounded-full border border-line-strong px-3 py-1 text-sm text-soft">{r.duration}</span>
            <ExampleTag show={r.example} />
          </div>
          <h3 className="mt-5 text-3xl font-bold sm:text-4xl">{r.name}</h3>
          <p className="mt-3 max-w-lg text-lg leading-relaxed text-soft">{r.description}</p>
        </div>

        {total > 1 && (
          <>
            <div className="mt-8 flex items-center gap-4">
              <button type="button" onClick={() => go(index - 1)} aria-label="Resultado anterior" className={arrowCls}>
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Próximo resultado" className={arrowCls}>
                <ChevronRight aria-hidden className="size-5" />
              </button>
              <div className="ml-2 flex items-center gap-1">
                {results.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Ir para o resultado ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    className="grid h-11 w-6 place-items-center"
                  >
                    <span
                      aria-hidden
                      className={`block h-2 rounded-full transition-[width,background-color] duration-500 ${i === index ? "w-6 bg-brand" : "w-2 bg-line-strong"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* miniaturas: o "depois" de cada resultado */}
            <ul className="mt-6 flex gap-3" aria-label="Escolher resultado">
              {results.map((res, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Ver o resultado ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`relative block h-20 w-16 overflow-hidden rounded-xl border-2 transition-[border-color,opacity,transform] duration-300 hover:-translate-y-0.5 ${
                      i === index ? "border-brand" : "border-line opacity-60 hover:opacity-100"
                    }`}
                  >
                    {res.after ? (
                      <Image src={res.after.src} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center bg-subtle text-muted">
                        <ImageIcon aria-hidden className="size-4" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
