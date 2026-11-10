import Image from "next/image";
import { LANDING } from "@/lib/landing-content";
import Reveal from "@/components/landing/reveal";
import SectionHeading from "@/components/landing/section-heading";
import s from "@/components/landing/landing.module.css";

type Testimonial = (typeof LANDING.testimonials)[number] & { photo?: { src: string; alt: string } | null };

// DEPOIMENTOS (#depoimentos). Só aparecem depoimentos reais e autorizados (o filtro fica no
// page.tsx). Foto é opcional: sem ela, mostra a inicial do nome.
export default function Testimonials({ index, items }: { index: number; items: Testimonial[] }) {
  return (
    <section id="depoimentos" aria-labelledby="depoimentos-title" className="relative scroll-mt-16 overflow-hidden border-t border-line bg-[#0d0d0f] py-24 sm:py-32">
      <div aria-hidden className={`absolute inset-0 ${s.cornerGlow}`} />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading id="depoimentos-title" index={index} label="Depoimentos" title="O que dizem os alunos" />
        </Reveal>
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <Reveal as="li" key={i} delay={(i % 3) * 100} className="h-full">
              <figure data-glow className={`${s.card} flex h-full flex-col rounded-2xl border border-line bg-card p-7`}>
                <span aria-hidden className="font-display text-7xl font-extrabold leading-[0.5] text-brand-ink">
                  “
                </span>
                <blockquote className="mt-6 flex-1 text-lg leading-relaxed text-strong">{t.quote}</blockquote>
                <figcaption className="mt-7 flex items-center gap-3 border-t border-line pt-5">
                  {t.photo ? (
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-full">
                      <Image src={t.photo.src} alt={t.photo.alt} fill sizes="44px" className="object-cover" />
                    </span>
                  ) : (
                    <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft font-display font-bold text-brand-ink">
                      {t.name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-sm text-muted">{t.detail}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
