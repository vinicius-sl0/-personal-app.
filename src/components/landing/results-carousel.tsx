"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon, Pause, Play } from "lucide-react";
import type { Photo } from "@/lib/landing-content";
import { ExampleTag } from "@/components/landing/example-tag";

type Result = {
  name: string;
  goal: string;
  duration: string;
  description: string;
  before: Photo;
  after: Photo;
  example: boolean;
};

function Shot({ photo, label, after }: { photo: Photo; label: string; after?: boolean }) {
  return (
    <figure className="relative aspect-[3/4] overflow-hidden bg-subtle">
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1024px) 300px, 45vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="grid h-full place-items-center text-muted">
          <ImageIcon aria-hidden className="size-7 opacity-60" />
        </div>
      )}
      <figcaption
        className={`absolute left-2 top-2 rounded-md px-2.5 py-1 font-display text-sm font-bold ${
          after ? "bg-brand text-brand-contrast" : "bg-black/80 text-white"
        }`}
      >
        {label}
      </figcaption>
    </figure>
  );
}

const arrowCls =
  "grid size-12 place-items-center rounded-full border border-line-strong bg-surface/90 text-ink shadow-lg backdrop-blur transition-colors hover:border-brand hover:text-brand-ink disabled:pointer-events-none disabled:opacity-30";

const AUTOPLAY_MS = 4500; // tempo de cada cartão
const RESUME_MS = 8000; // depois de a pessoa mexer, espera isso para voltar a girar

// Carrossel "Resultados reais": passa sozinho (um cartão a cada 4,5 s, voltando ao início no fim)
// e também pelo dedo/mouse, pelas setas e pelos pontinhos. Pausa ao passar o mouse, tocar ou usar
// o teclado, quando está fora da tela, e tem botão de pausar (acessibilidade). Com "reduzir
// movimento" ligado no aparelho, não gira sozinho.
export default function ResultsCarousel({ results }: { results: Result[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [positions, setPositions] = useState(results.length); // quantas paradas existem
  const [overflow, setOverflow] = useState(results.length > 1); // tem cartão fora da tela?
  const [paused, setPaused] = useState(false); // pelo botão
  const [holding, setHolding] = useState(false); // mouse em cima / foco / toque recente
  const [onScreen, setOnScreen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Posição atual, quantas paradas cabem e se há o que rolar.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const card = el.querySelector("li");
      const step = (card?.clientWidth ?? 1) + 20;
      const perView = Math.max(1, Math.round((el.clientWidth + 20) / step));
      const total = Math.max(1, results.length - perView + 1);
      setPositions(total);
      setIndex(Math.min(Math.round(el.scrollLeft / step), total - 1));
      setOverflow(el.scrollWidth > el.clientWidth + 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [results.length]);

  // Só gira quando a seção está na tela e o aparelho não pediu "reduzir movimento".
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    const el = root.current;
    const io =
      el && "IntersectionObserver" in window
        ? new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.3 })
        : null;
    if (el && io) io.observe(el);
    else setOnScreen(true);
    return () => {
      mq.removeEventListener("change", onMq);
      io?.disconnect();
    };
  }, []);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    const card = el?.querySelectorAll("li")[i];
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, []);

  const next = useCallback(() => goTo(index >= positions - 1 ? 0 : index + 1), [goTo, index, positions]);
  const prev = useCallback(() => goTo(index <= 0 ? positions - 1 : index - 1), [goTo, index, positions]);

  const autoplay = overflow && !paused && !holding && onScreen && !reduced;
  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [autoplay, next, index]);

  // A pessoa mexeu (toque, seta, pontinho, teclado): pausa e volta a girar depois de um tempo.
  const hold = useCallback(() => {
    setHolding(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setHolding(false), RESUME_MS);
  }, []);
  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Resultados de alunos"
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHolding(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && hold()}
      onTouchStart={hold}
      onFocus={() => setHolding(true)}
      onBlur={hold}
    >
      <ul
        ref={track}
        aria-live={autoplay ? "off" : "polite"}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {results.map((r, i) => (
          <li
            key={i}
            role="group"
            aria-roledescription="item"
            aria-label={`${i + 1} de ${results.length}`}
            className="w-[86%] shrink-0 snap-start sm:w-[58%] lg:w-[calc((100%-1.25rem)/2)]"
          >
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-brand/60">
              <div className="grid grid-cols-2 gap-px bg-line">
                <Shot photo={r.before} label="Antes" />
                <Shot photo={r.after} label="Depois" after />
              </div>
              {/* Faixa com o tempo de acompanhamento, em destaque */}
              <p className="bg-brand px-4 py-2 text-center font-display text-base font-bold text-brand-contrast">{r.duration}</p>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-brand-ink">{r.goal}</span>
                  <ExampleTag show={r.example} />
                </div>
                <h3 className="mt-1 text-lg font-semibold">{r.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-soft">{r.description}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {/* Setas, pontinhos e pausar: só quando há cartões fora da tela */}
      {results.length > 1 && overflow && (
        <>
          {/* Setas nas laterais (computador) */}
          <button
            type="button"
            onClick={() => {
              hold();
              prev();
            }}
            aria-label="Resultado anterior"
            className={`${arrowCls} absolute -left-5 top-[38%] hidden -translate-y-1/2 lg:grid`}
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              hold();
              next();
            }}
            aria-label="Próximo resultado"
            className={`${arrowCls} absolute -right-5 top-[38%] hidden -translate-y-1/2 lg:grid`}
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>

          {/* Setas (celular) + pontinhos + pausar */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <button type="button" onClick={() => {
              hold();
              prev();
            }} aria-label="Resultado anterior" className={`${arrowCls} !size-10 lg:hidden`}>
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: positions }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    hold();
                    goTo(i);
                  }}
                  aria-label={`Ver resultado ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-7 bg-brand" : "w-2 bg-line-strong hover:bg-chrome"}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => {
              hold();
              next();
            }} aria-label="Próximo resultado" className={`${arrowCls} !size-10 lg:hidden`}>
              <ChevronRight aria-hidden className="size-5" />
            </button>
            {!reduced && (
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                aria-label={paused ? "Continuar passando os resultados" : "Pausar os resultados"}
                title={paused ? "Continuar" : "Pausar"}
                className={`${arrowCls} !size-10`}
              >
                {paused ? <Play aria-hidden className="ml-0.5 size-4" /> : <Pause aria-hidden className="size-4" />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
