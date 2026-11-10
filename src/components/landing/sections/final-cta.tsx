import Image from "next/image";
import { Mail, MapPin } from "lucide-react";
import { LANDING } from "@/lib/landing-content";
import Reveal from "@/components/landing/reveal";
import LpButton from "@/components/landing/lp-button";
import { InstagramIcon, WhatsAppIcon } from "@/components/landing/social-icons";
import s from "@/components/landing/landing.module.css";

const smallLinkCls =
  "inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-4 font-display text-sm font-semibold text-soft transition-colors hover:border-chrome hover:text-ink";

// CHAMADA FINAL (#contato): fundo preto com luz laranja vinda de baixo e o monograma grande.
// Mantém os caminhos de sempre: cadastro (/quero-ser-aluno), WhatsApp e os contatos configurados.
export default function FinalCta({ whatsappHref }: { whatsappHref: string | null }) {
  const { contact } = LANDING;
  return (
    <section id="contato" aria-labelledby="contato-title" className="relative scroll-mt-16 overflow-hidden border-t border-line py-28 sm:py-36">
      <div aria-hidden className={`absolute inset-0 ${s.bottomGlow}`} />
      <div aria-hidden className={`absolute inset-0 opacity-60 ${s.slashes}`} />
      <Image
        src="/landing/monograma.webp"
        alt=""
        width={589}
        height={439}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 w-[min(46rem,120vw)] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
        <Reveal from="scale">
          <h2 id="contato-title" className="font-display text-[clamp(2.3rem,7vw,4.8rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] [font-stretch:110%]">
            Seu próximo treino começa com <span className="text-brand">uma conversa.</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-soft sm:text-xl">
            Responda 4 perguntas rápidas e continue comigo no WhatsApp para montarmos o seu acompanhamento.
          </p>
        </Reveal>
        <Reveal delay={180} className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <LpButton href="/quero-ser-aluno" size="lg" className="w-full sm:w-auto">
            Quero ser aluno
          </LpButton>
          {whatsappHref && (
            <LpButton href={whatsappHref} variant="ghost" size="lg" className="w-full sm:w-auto">
              <WhatsAppIcon /> Falar no WhatsApp
            </LpButton>
          )}
        </Reveal>

        {(contact.instagram || contact.email || contact.city || contact.others.length > 0) && (
          <Reveal delay={240} className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {contact.instagram && (
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className={smallLinkCls}>
                <InstagramIcon /> Instagram
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className={smallLinkCls}>
                <Mail aria-hidden className="size-5" /> E-mail
              </a>
            )}
            {contact.others.map((o) => (
              <a key={o.href} href={o.href} target="_blank" rel="noopener noreferrer" className={smallLinkCls}>
                {o.label}
              </a>
            ))}
            {contact.city && (
              <span className="inline-flex items-center gap-2 px-2 text-sm text-soft">
                <MapPin aria-hidden className="size-4" /> {contact.city}
              </span>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
