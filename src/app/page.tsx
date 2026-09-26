import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  Mail,
  MapPin,
  MessageCircle,
  PlayCircle,
  Quote,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { LANDING } from "@/lib/landing-content";
import { btnPrimaryCls } from "@/lib/ui";
import { Badge } from "@/components/ui/badge";
import ResultsCarousel from "@/components/landing/results-carousel";
import { InstagramIcon, WhatsAppIcon } from "@/components/landing/social-icons";

const BENEFIT_ICONS = {
  target: Target,
  video: PlayCircle,
  check: CheckCircle2,
  chart: BarChart3,
  message: MessageCircle,
  shield: ShieldCheck,
} as const;

const NAV = [
  { href: "#sobre", label: "Sobre" },
  { href: "#resultados", label: "Resultados" },
  { href: "#beneficios", label: "Benefícios" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#contato", label: "Contato" },
];

const btnOutlineCls =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong px-6 text-base font-semibold text-ink transition hover:border-brand hover:text-brand-ink";

function ExampleBadge({ show }: { show: boolean }) {
  return show ? <Badge tone="warning">Exemplo</Badge> : null;
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-soft">{description}</p>}
    </div>
  );
}

export default function Home() {
  const { hero, about, results, benefits, testimonials, contact } = LANDING;
  const whatsappHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappMessage)}`
    : null;
  const year = new Date().getFullYear();

  return (
    <div className="min-h-dvh bg-surface">
      {LANDING.draft && (
        <p className="bg-amber-400 px-4 py-2 text-center text-xs font-medium text-black">
          Página em construção: textos e imagens marcados como “Exemplo” serão trocados pelo conteúdo real.
        </p>
      )}

      {/* Topo fixo */}
      <header className="theme-dark sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-brand text-brand-contrast">
              <Dumbbell className="size-5" />
            </span>
            <span className="font-bold">{BRAND.name}</span>
          </Link>
          <nav aria-label="Seções da página" className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-soft transition hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <Link href="/login" className={`${btnPrimaryCls} ml-auto !h-10 !w-auto px-4 text-sm lg:ml-2`}>
            Entrar
          </Link>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="theme-dark relative overflow-hidden bg-surface">
          <div aria-hidden className="pointer-events-none absolute -right-40 top-10 size-[36rem] rounded-full bg-brand/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 size-[26rem] rounded-full bg-brand/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
            <div className="animate-slide-up">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-soft">
                <span aria-hidden className="size-1.5 rounded-full bg-brand" /> Personal Trainer
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{hero.name}</h1>
              <p className="mt-4 text-xl font-semibold leading-snug text-brand-ink sm:text-2xl">{hero.headline}</p>
              <p className="mt-4 max-w-xl text-base text-soft sm:text-lg">{hero.description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#sobre" className={`${btnPrimaryCls} sm:!w-auto sm:px-7`}>
                  Conheça meu trabalho <ArrowRight aria-hidden className="size-4" />
                </a>
                <Link href="/login" className={btnOutlineCls}>
                  Entrar na plataforma
                </Link>
              </div>
              {hero.example && (
                <p className="mt-6">
                  <ExampleBadge show />
                </p>
              )}
            </div>

            {/* Foto do Personal, com bastante destaque */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div aria-hidden className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-brand/60 via-brand/10 to-transparent blur-xl" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line bg-card">
                {hero.photo ? (
                  <Image src={hero.photo.src} alt={hero.photo.alt} fill priority sizes="(min-width: 1024px) 480px, 90vw" className="object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-subtle to-card text-center text-muted">
                    <UserRound aria-hidden className="size-20 opacity-40" />
                    <p className="text-sm">Espaço para a foto principal do Personal</p>
                    <ExampleBadge show />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SOBRE */}
        <section id="sobre" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <SectionTitle eyebrow="Quem sou" title={about.title} />
              <ExampleBadge show={about.example} />
            </div>
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4 text-lg text-soft">
                {about.story.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  {about.specialties.map((s) => (
                    <span key={s} className="rounded-full border border-line-strong bg-card px-3 py-1.5 text-sm font-medium text-ink">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-3 self-start">
                {about.stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-line bg-card p-4 text-center">
                    <dt className="sr-only">{s.label}</dt>
                    <dd>
                      <span className="block text-2xl font-extrabold text-brand-ink sm:text-3xl">{s.value}</span>
                      <span className="mt-1 block text-xs text-muted">{s.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <h3 className="mb-5 mt-16 text-xl font-bold">Como eu trabalho</h3>
            <ol className="grid gap-4 md:grid-cols-3">
              {about.methodology.map((m, i) => (
                <li key={m.title} className="rounded-2xl border border-line bg-card p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand text-sm font-bold text-brand-contrast">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-4 font-semibold">{m.title}</p>
                  <p className="mt-1 text-sm text-soft">{m.text}</p>
                </li>
              ))}
            </ol>
            <blockquote className="mt-10 border-l-4 border-brand pl-5 text-lg italic text-strong">{about.goals}</blockquote>
          </div>
        </section>

        {/* RESULTADOS */}
        <section id="resultados" className="theme-dark scroll-mt-16 bg-surface py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle
              eyebrow="Transformações"
              title="Resultados reais"
              description="Alunos que confiaram no processo. Publicados somente com autorização de cada um."
            />
            <ResultsCarousel results={results} />
            <p className="mt-4 text-xs text-muted">Resultados individuais variam conforme dedicação, rotina e condições de cada pessoa.</p>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section id="beneficios" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle eyebrow="Por que ter acompanhamento" title="Tudo o que você precisa para evoluir" />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b) => {
                const Icon = BENEFIT_ICONS[b.icon as keyof typeof BENEFIT_ICONS];
                return (
                  <li key={b.title} className="group rounded-2xl border border-line bg-card p-6 transition hover:-translate-y-0.5 hover:border-brand/50">
                    <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink transition group-hover:bg-brand group-hover:text-brand-contrast">
                      <Icon className="size-5" />
                    </span>
                    <p className="mt-4 font-semibold">{b.title}</p>
                    <p className="mt-1 text-sm text-soft">{b.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section id="depoimentos" className="scroll-mt-16 border-y border-line bg-card py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle eyebrow="Depoimentos" title="O que dizem os alunos" />
            <ul className="grid gap-4 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <li key={i} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                  <Quote aria-hidden className="size-7 text-brand-ink" />
                  <p className="mt-4 flex-1 text-soft">“{t.quote}”</p>
                  <div className="mt-6 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-muted">{t.detail}</p>
                    </div>
                    <ExampleBadge show={t.example} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CONTATO */}
        <section id="contato" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="theme-dark relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-12">
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/25 blur-3xl" />
              <div className="relative max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Vamos começar?</h2>
                <p className="mt-3 text-soft">Fale comigo e descubra como o acompanhamento pode funcionar para você.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${btnPrimaryCls} !w-auto px-6`}>
                      <WhatsAppIcon /> Chamar no WhatsApp
                    </a>
                  )}
                  {contact.instagram && (
                    <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className={btnOutlineCls}>
                      <InstagramIcon /> Instagram
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className={btnOutlineCls}>
                      <Mail aria-hidden className="size-5" /> E-mail
                    </a>
                  )}
                  {contact.others.map((o) => (
                    <a key={o.href} href={o.href} target="_blank" rel="noopener noreferrer" className={btnOutlineCls}>
                      {o.label}
                    </a>
                  ))}
                  {!whatsappHref && !contact.instagram && !contact.email && contact.others.length === 0 && (
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <ExampleBadge show /> WhatsApp, Instagram e outras redes aparecem aqui quando forem configurados.
                    </p>
                  )}
                </div>
                {contact.city && (
                  <p className="mt-6 flex items-center gap-2 text-sm text-soft">
                    <MapPin aria-hidden className="size-4 text-brand-ink" /> {contact.city}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="theme-dark border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-brand text-brand-contrast">
                <Dumbbell className="size-5" />
              </span>
              <span className="font-bold">{BRAND.name}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-soft">{BRAND.tagline}</p>
            <div className="mt-5 flex gap-2">
              {contact.instagram && (
                <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-10 place-items-center rounded-xl border border-line text-soft hover:border-brand hover:text-brand-ink">
                  <InstagramIcon />
                </a>
              )}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid size-10 place-items-center rounded-xl border border-line text-soft hover:border-brand hover:text-brand-ink">
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          </div>
          <nav aria-label="Links do rodapé">
            <p className="mb-3 text-sm font-semibold">Navegação</p>
            <ul className="space-y-2 text-sm text-soft">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-ink">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="mb-3 text-sm font-semibold">Plataforma</p>
            <ul className="space-y-2 text-sm text-soft">
              <li>
                <Link href="/login" className="hover:text-ink">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-ink">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-ink">
                  Política de privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
            © {year} {BRAND.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
