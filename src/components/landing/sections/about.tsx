import Image from "next/image";
import { BadgeCheck, UserRound } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { LANDING } from "@/lib/landing-content";
import { ExampleTag } from "@/components/landing/example-tag";
import Reveal from "@/components/landing/reveal";
import Parallax from "@/components/landing/parallax";
import SectionHeading from "@/components/landing/section-heading";
import LpButton from "@/components/landing/lp-button";
import s from "@/components/landing/landing.module.css";

// CONHEÇA A MARÍLIA (#sobre). Composição editorial: a foto em camadas (bloco laranja deslocado
// atrás, que se move em outra velocidade ao rolar, e o selo do CREF por cima), e ao lado a
// história, o compromisso, os números e as especialidades.
export default function About({ index }: { index: number }) {
  const { about } = LANDING;
  const cref = about.stats.find((st) => st.label === "CREF");
  const numbers = about.stats.filter((st) => st.label !== "CREF");

  return (
    <section id="sobre" aria-labelledby="sobre-title" className="relative scroll-mt-16 overflow-hidden border-t border-line bg-[#0d0d0f] py-24 sm:py-32">
      <div aria-hidden className={`absolute inset-0 opacity-60 ${s.slashes}`} />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* foto em camadas */}
        <Reveal from="left" className="mx-auto w-full max-w-[24rem] lg:max-w-none">
          <div className="relative pb-6 pr-6">
            <Parallax speed={-0.06} className="absolute bottom-0 right-0 top-10 left-10 z-0">
              <div aria-hidden className="size-full rounded-2xl bg-brand" />
            </Parallax>
            <div className="relative z-[1] aspect-[4/5] overflow-hidden rounded-2xl border border-line-strong bg-card">
              {about.photo ? (
                <>
                  <Image
                    src={about.photo.src}
                    alt={about.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 420px, 90vw"
                    className="object-cover object-[50%_30%] transition-transform duration-[1.2s] ease-out hover:scale-[1.03]"
                  />
                  {/* letreiro vermelho da academia sem cor, como na primeira tela */}
                  <div aria-hidden className="absolute inset-x-0 top-0 h-[22%] backdrop-brightness-[0.45] backdrop-grayscale [mask-image:linear-gradient(to_bottom,black_70%,transparent)]" />
                </>
              ) : (
                <div className="grid size-full place-items-center text-muted">
                  <UserRound aria-hidden className="size-20 opacity-30" />
                </div>
              )}
            </div>
            {cref && (
              <div className="absolute -left-3 bottom-12 z-[2] flex items-center gap-3 rounded-2xl border border-line-strong bg-surface/90 px-4 py-3 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.9)] backdrop-blur sm:-left-8">
                <BadgeCheck aria-hidden className="size-6 text-brand-ink" />
                <div>
                  <p className="text-xs text-muted">CREF</p>
                  <p className="font-display font-bold tabular-nums">{cref.value}</p>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* texto */}
        <div className="min-w-0">
          <Reveal>
            <SectionHeading id="sobre-title" index={index} label="Sobre" title={about.title} />
            <p className="mt-4 font-display text-base font-bold uppercase tracking-[0.1em] text-chrome [font-stretch:112%] sm:text-lg sm:tracking-[0.14em]">
              {BRAND.name} · Personal Trainer
            </p>
            <ExampleTag show={about.example} />
          </Reveal>

          <Reveal delay={100} className="mt-8 max-w-[62ch] space-y-4 text-lg leading-relaxed text-strong">
            {about.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Reveal>

          <Reveal delay={150}>
            <blockquote className="mt-10 border-l-4 border-brand pl-6 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
              {about.goals}
            </blockquote>
          </Reveal>

          <Reveal delay={200} className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-[auto_1fr] sm:gap-10">
            <dl className="flex gap-8">
              {numbers.map((st) => (
                <div key={st.label} className="flex flex-col">
                  <dt className="order-2 mt-1.5 text-sm text-muted">{st.label}</dt>
                  <dd className="order-1 font-display text-4xl font-extrabold leading-none text-brand-ink [font-stretch:115%]">{st.value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="text-sm font-semibold text-soft">Especialidades</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {about.specialties.map((sp) => (
                  <li key={sp} className="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-brand/60">
                    {sp}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={250} className="mt-10">
            <LpButton href="/quero-ser-aluno">Quero ser aluno</LpButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
