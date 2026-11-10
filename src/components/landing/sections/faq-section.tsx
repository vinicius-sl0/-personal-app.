import Faq from "@/components/landing/faq";
import Reveal from "@/components/landing/reveal";
import SectionHeading from "@/components/landing/section-heading";
import LpButton from "@/components/landing/lp-button";
import { WhatsAppIcon } from "@/components/landing/social-icons";

// PERGUNTAS FREQUENTES (#duvidas): título à esquerda (fixo ao rolar no computador), lista à direita.
export default function FaqSection({ index, whatsappHref }: { index: number; whatsappHref: string | null }) {
  return (
    <section id="duvidas" aria-labelledby="duvidas-title" className="relative scroll-mt-16 border-t border-line py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="duvidas-title" index={index} label="Dúvidas" title="Perguntas frequentes" description="O que costuma surgir antes de começar." />
          {whatsappHref && (
            <div className="mt-8">
              <p className="mb-3 text-soft">Ficou alguma dúvida?</p>
              <LpButton href={whatsappHref} variant="ghost">
                <WhatsAppIcon /> Falar no WhatsApp
              </LpButton>
            </div>
          )}
        </Reveal>
        <Reveal delay={120}>
          <Faq />
        </Reveal>
      </div>
    </section>
  );
}
