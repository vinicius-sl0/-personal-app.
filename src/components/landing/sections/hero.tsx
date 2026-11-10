import Image from "next/image";
import { UserRound } from "lucide-react";
import { LANDING } from "@/lib/landing-content";
import { ExampleTag } from "@/components/landing/example-tag";
import LpButton from "@/components/landing/lp-button";
import Parallax from "@/components/landing/parallax";
import s from "@/components/landing/landing.module.css";

// PRIMEIRA TELA. Camadas, de trás para a frente: luz laranja atrás da Personal → foto (com zoom
// lento de entrada e profundidade ao rolar no computador) → cortes diagonais e monograma em marca
// d'água → degradês que fundem a foto com o preto → texto. No celular a foto fica em cima, com o
// rosto livre; no computador ela ocupa a direita.
export default function Hero({ showResults }: { showResults: boolean }) {
  const { hero, about } = LANDING;
  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <section aria-labelledby="hero-title" className="relative -mt-16 overflow-hidden bg-surface">
      <div aria-hidden className="absolute inset-0">
        {/* luz atrás da Personal */}
        <div className={`absolute inset-x-0 top-0 h-[72svh] lg:inset-y-0 lg:left-auto lg:h-auto lg:w-[60%] ${s.heroGlow}`} />

        {/* foto */}
        <Parallax speed={0.12} className="absolute inset-x-0 top-0 h-[68svh] sm:h-[74svh] lg:inset-y-0 lg:left-auto lg:h-auto lg:w-[58%]">
          <div className={`relative size-full ${s.heroZoom}`}>
            {hero.photo ? (
              <Image
                src={hero.photo.src}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover object-[55%_22%] lg:object-[50%_28%]"
              />
            ) : (
              <div className="grid h-full place-items-center bg-card text-muted">
                <UserRound className="size-24 opacity-30" />
              </div>
            )}
            {/* Letreiro vermelho da academia no alto da foto: sem cor e escurecido, para não competir
                com o laranja da marca (o rosto, mais abaixo, mantém a cor). */}
            <div className="absolute inset-x-0 top-0 h-[27%] backdrop-brightness-[0.4] backdrop-grayscale [mask-image:linear-gradient(to_bottom,black_70%,transparent)]" />
          </div>
        </Parallax>

        {/* fusões com o preto */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-surface/90 to-transparent" />
        <div className="absolute inset-x-0 top-[30svh] h-[42svh] bg-gradient-to-t from-surface via-surface/80 to-transparent sm:top-[34svh] lg:hidden" />
        <div className="absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-surface from-35% via-surface/75 to-transparent lg:block" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface to-transparent" />

        {/* cortes diagonais e monograma */}
        <div className={`absolute inset-0 opacity-70 ${s.slashes}`} />
        <Image
          src="/landing/monograma.webp"
          alt=""
          width={589}
          height={439}
          className="absolute -bottom-16 -left-24 hidden w-[44rem] max-w-none opacity-[0.045] lg:block"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 pt-[44svh] sm:px-6 sm:pb-32 sm:pt-[50svh] lg:flex lg:min-h-[820px] lg:items-center lg:pb-36 lg:pt-32">
        <div className="max-w-[40rem]">
          <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-chrome ${s.rise}`}>
            <span className="whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.16em] [font-stretch:118%] sm:tracking-[0.22em]">
              {hero.brand}
            </span>
            <span aria-hidden className="hidden h-px w-10 bg-chrome/50 sm:block" />
            <span className="whitespace-nowrap text-sm">Personal Trainer</span>
          </p>

          <h1
            id="hero-title"
            className={`mt-5 font-display text-[clamp(2.7rem,9vw,5.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.02em] [font-stretch:112%] ${s.rise}`}
            style={delay(80)}
          >
            {hero.headline.lead} <span className="text-brand">{hero.headline.accent}</span>{" "}
            <span className="mt-3 block text-[0.42em] font-bold normal-case leading-tight tracking-normal text-strong [font-stretch:100%]">
              {hero.headline.tail}
            </span>
          </h1>

          <p className={`mt-6 max-w-xl text-lg leading-relaxed text-soft sm:text-xl ${s.rise}`} style={delay(160)}>
            {hero.description}
          </p>

          <div className={`mt-9 flex flex-col gap-3 sm:flex-row ${s.rise}`} style={delay(240)}>
            <LpButton href="/quero-ser-aluno" size="lg">
              Quero ser aluno
            </LpButton>
            <LpButton href={showResults ? "#resultados" : "#como-funciona"} variant="ghost" size="lg">
              {showResults ? "Ver resultados" : "Como funciona"}
            </LpButton>
          </div>

          {/* números reais (de about.stats) */}
          <dl className={`mt-11 grid max-w-xl grid-cols-3 divide-x divide-line border-t border-line pt-5 ${s.rise}`} style={delay(320)}>
            {about.stats.map((st, i) => (
              <div key={st.label} className={`flex min-w-0 flex-col ${i === 0 ? "pr-3" : "px-3 sm:px-5"}`}>
                <dt className="order-2 mt-1.5 text-xs leading-tight text-muted sm:text-sm">{st.label}</dt>
                <dd
                  className={`order-1 font-display font-bold leading-none text-brand-ink ${
                    st.value.length > 5 ? "pt-1 text-sm sm:text-lg" : "text-xl [font-stretch:115%] sm:text-2xl"
                  }`}
                >
                  {st.value}
                </dd>
              </div>
            ))}
          </dl>
          {(hero.example || about.example) && (
            <p className="mt-3">
              <ExampleTag />
            </p>
          )}
        </div>
      </div>
      {hero.photo && <span className="sr-only">{hero.photo.alt}</span>}
    </section>
  );
}
