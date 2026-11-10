import Image from "next/image";
import { Check, X } from "lucide-react";
import { LANDING } from "@/lib/landing-content";
import Reveal from "@/components/landing/reveal";
import SectionHeading from "@/components/landing/section-heading";
import s from "@/components/landing/landing.module.css";

// "O JEITO COMUM DE TREINAR X MARÍLIA TEAM". O lado comum é apagado, com ✕ cinza (não vermelho,
// para não depreciar ninguém); o lado do Team é elevado, com ✓ laranja e o monograma ao fundo.
export default function Comparison({ index }: { index: number }) {
  const { comparison } = LANDING;
  return (
    <section id="comparativo" aria-labelledby="comparativo-title" className="relative scroll-mt-16 overflow-hidden border-t border-line bg-[#0d0d0f] py-24 sm:py-32">
      <div aria-hidden className={`absolute inset-0 opacity-50 ${s.slashes}`} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            id="comparativo-title"
            center
            index={index}
            label="A diferença"
            title={
              <>
                O jeito comum de treinar <span className="text-brand">X</span> Marília Team.
              </>
            }
            description="Treinar por conta própria é um começo. Com acompanhamento individualizado, cada treino tem um porquê."
          />
        </Reveal>

        <div className="mt-14 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-0">
          <Reveal from="left" className="md:mr-6 md:mt-6">
            <div className="h-full rounded-2xl border border-line bg-[#111113] p-6 sm:p-8">
              <h3 className="text-xl font-bold text-soft sm:text-2xl">O jeito comum</h3>
              <ul className="mt-6 space-y-4">
                {comparison.common.map((item, i) => (
                  <Reveal as="li" key={item} from="left" delay={150 + i * 70} className="flex items-start gap-3 text-muted">
                    <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-line-strong">
                      <X className="size-3.5" />
                    </span>
                    <span className="leading-snug">{item}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>

          <div aria-hidden className="flex items-center justify-center md:px-0">
            <Reveal from="scale" delay={200}>
              <span className="grid size-14 place-items-center rounded-full border border-line-strong bg-surface font-display text-sm font-extrabold tracking-wider text-chrome [font-stretch:120%]">
                VS
              </span>
            </Reveal>
          </div>

          <Reveal from="right" className="md:ml-6">
            <div className={`relative h-full overflow-hidden rounded-2xl p-6 sm:p-8 ${s.teamPanel}`}>
              <Image
                src="/landing/monograma.webp"
                alt=""
                width={589}
                height={439}
                aria-hidden
                className="pointer-events-none absolute -bottom-10 -right-10 w-64 opacity-[0.07]"
              />
              <h3 className="relative flex items-center gap-3 text-xl font-bold sm:text-2xl">
                <Image src="/landing/monograma.webp" alt="" width={589} height={439} aria-hidden className="h-6 w-auto" />
                Marília Team
              </h3>
              <ul className="relative mt-6 space-y-4">
                {comparison.team.map((item, i) => (
                  <Reveal as="li" key={item} from="right" delay={200 + i * 70} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink ${s.checkIcon}`}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="font-medium leading-snug text-ink">{item}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
