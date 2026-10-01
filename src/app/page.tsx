import Image from "next/image";
import Link from "next/link";
import { BarChart3, CheckCircle2, Mail, MapPin, MessageCircle, PlayCircle, ShieldCheck, Target, UserRound } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { LANDING } from "@/lib/landing-content";
import { btnPrimaryCls } from "@/lib/ui";
import ResultsCarousel from "@/components/landing/results-carousel";
import { ExampleTag } from "@/components/landing/example-tag";
import { InstagramIcon, WhatsAppIcon } from "@/components/landing/social-icons";
import { BrandMark } from "@/components/brand-mark";

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
  { href: "#no-app", label: "No app" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#contato", label: "Contato" },
];

const btnOutlineCls =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-line-strong px-6 font-display text-base font-semibold text-ink transition-colors hover:border-chrome hover:bg-subtle";

// Nome em Saira bem larga: o mesmo desenho do "MARILIA FERREIRA" do logo.
const wideCls = "font-display uppercase [font-stretch:125%]";

// Linha "PERSONAL TRAINER" entre dois traços cromados, como embaixo do nome no logo.
function TrainerRule() {
  return (
    <p className="flex items-center gap-3 text-sm font-semibold text-chrome">
      <span aria-hidden className="h-px w-8 bg-chrome/60" />
      <span className="font-display uppercase tracking-[0.3em] [font-stretch:112%]">Personal Trainer</span>
      <span aria-hidden className="h-px flex-1 bg-chrome/60" />
    </p>
  );
}

function SectionTitle({ title, description, aside }: { title: string; description?: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-10 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2">
      <div>
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 max-w-2xl text-soft sm:text-lg">{description}</p>}
      </div>
      {aside}
    </div>
  );
}

export default function Home() {
  const { hero, about, results, benefits, testimonials, contact } = LANDING;
  const whatsappHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappMessage)}`
    : null;
  const [firstName, ...rest] = hero.name.split(" ");
  const lastName = rest.join(" ");
  // Depoimentos e resultados só de exemplo NÃO aparecem com a página publicada (draft: false).
  const showTestimonials = testimonials.some((t) => !t.example) || LANDING.draft;
  const visibleTestimonials = LANDING.draft ? testimonials : testimonials.filter((t) => !t.example);
  const visibleResults = LANDING.draft ? results : results.filter((r) => !r.example);
  const nav = NAV.filter(
    (n) => (n.href !== "#depoimentos" || showTestimonials) && (n.href !== "#resultados" || visibleResults.length > 0),
  );
  const year = new Date().getFullYear();

  return (
    <div className="min-h-dvh bg-surface">
      {LANDING.draft && (
        <p className="bg-amber-400 px-4 py-2 text-center text-xs font-medium text-black">
          Página em construção: textos e imagens marcados como “Exemplo” serão trocados pelo conteúdo real.
        </p>
      )}

      {/* Topo fixo */}
      <header className="theme-dark sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size="md" />
            <span className="font-display font-semibold">{BRAND.name}</span>
          </Link>
          <nav aria-label="Seções da página" className="ml-auto hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="rounded-[10px] px-3 py-2 text-sm text-soft transition-colors hover:text-ink">
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
        {/* HERO: foto grande da Personal com o nome largo por cima da borda */}
        <section className="theme-dark relative overflow-hidden bg-surface">
          <div className="mx-auto grid max-w-6xl lg:grid-cols-[1fr_1fr] lg:items-stretch">
            {/* Foto: primeiro no celular, à direita no computador */}
            <div className="relative aspect-[4/5] max-h-[78svh] w-full sm:aspect-[5/4] lg:order-2 lg:aspect-auto lg:max-h-none lg:min-h-[680px]">
              {hero.photo ? (
                <Image
                  src={hero.photo.src}
                  alt={hero.photo.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 576px, 100vw"
                  className="object-cover object-[50%_28%]"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-card text-center text-muted">
                  <UserRound aria-hidden className="size-20 opacity-40" />
                  <p className="text-sm">Espaço para a foto principal da Personal</p>
                  <ExampleTag />
                </div>
              )}
              {/* Escurece o topo (letreiro da academia) e funde a foto com o fundo preto */}
              {/* Letreiro vermelho da academia no topo: fica em preto e branco e escurecido, para não
                  competir com o laranja da marca (o rosto, mais abaixo, mantém a cor). */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[24%] backdrop-brightness-[0.45] backdrop-grayscale [mask-image:linear-gradient(to_bottom,black_65%,transparent)]"
              />
              <div aria-hidden className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-surface/70 to-transparent" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface via-surface/70 to-transparent lg:hidden" />
              <div aria-hidden className="absolute inset-y-0 left-0 hidden w-2/5 bg-gradient-to-r from-surface to-transparent lg:block" />
              <div aria-hidden className="absolute inset-y-0 right-0 hidden w-1/6 bg-gradient-to-l from-surface to-transparent lg:block" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-1/4 bg-gradient-to-t from-surface to-transparent lg:block" />
            </div>

            <div className="relative z-10 -mt-28 px-4 pb-14 sm:-mt-32 sm:px-6 lg:order-1 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:py-24">
              <h1 className={`${wideCls} text-[clamp(2.6rem,12.5vw,5.75rem)] font-bold leading-[0.88] tracking-[-0.02em] lg:-mr-56 lg:text-[7.25rem] xl:text-[8rem]`}>
                <span className="block">{firstName}</span>
                {lastName && <span className="block text-chrome">{lastName}</span>}
              </h1>
              <div className="mt-5 max-w-md">
                <TrainerRule />
              </div>
              <p className="mt-8 max-w-xl text-2xl font-semibold leading-snug text-ink sm:text-[1.75rem]">{hero.headline}</p>
              <p className="mt-4 max-w-xl text-base text-soft sm:text-lg">{hero.description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/quero-ser-aluno" className={`${btnPrimaryCls} sm:!w-auto sm:px-7`}>
                  Quero me tornar aluno
                </Link>
                <Link href="/login" className={btnOutlineCls}>
                  Já sou aluno
                </Link>
              </div>
              {hero.example && (
                <p className="mt-6">
                  <ExampleTag />
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SOBRE */}
        <section id="sobre" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle title={about.title} aside={<ExampleTag show={about.example} />} />
            <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
              <div className="max-w-[65ch] space-y-4 text-lg leading-relaxed text-strong">
                {about.story.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="space-y-8">
                {/* Números em placar: um painel só, divisões cromadas */}
                <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-chrome/30">
                  {about.stats.map((s) => (
                    <div key={s.label} className="flex flex-col bg-card px-3 py-4 text-center sm:px-4">
                      <dt className="order-2 mt-1 text-xs leading-tight text-muted">{s.label}</dt>
                      <dd className={`order-1 text-2xl font-bold leading-none text-brand-ink sm:text-3xl ${wideCls}`}>{s.value}</dd>
                    </div>
                  ))}
                </dl>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-soft">Especialidades</h3>
                  <ul className="flex flex-wrap gap-2">
                    {about.specialties.map((s) => (
                      <li key={s} className="rounded-full border border-line-strong bg-card px-3.5 py-1.5 text-sm font-medium">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Como eu trabalho: é uma sequência de verdade, por isso os passos numerados */}
            <h3 className="mb-8 mt-20 text-2xl font-bold">Como eu trabalho</h3>
            <ol className="grid gap-10 md:grid-cols-3 md:gap-6">
              {about.methodology.map((m, i) => (
                <li key={m.title} className="relative border-t-2 border-line-strong pt-6">
                  <span aria-hidden className="absolute -top-[5px] left-0 h-2 w-10 rounded-full bg-brand" />
                  <span className={`block text-5xl font-bold leading-none text-chrome/50 ${wideCls}`}>{i + 1}</span>
                  <p className="mt-4 text-lg font-semibold">{m.title}</p>
                  <p className="mt-1 text-soft">{m.text}</p>
                </li>
              ))}
            </ol>
            <blockquote className="mt-16 max-w-3xl border-l-2 border-brand pl-6 text-xl leading-relaxed text-strong sm:text-2xl">
              {about.goals}
            </blockquote>
          </div>
        </section>

        {/* RESULTADOS */}
        {visibleResults.length > 0 && (
          <section id="resultados" className="theme-dark scroll-mt-16 bg-surface py-16 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionTitle
                title="Resultados reais"
                description="Alunos que confiaram no processo. Publicados somente com autorização de cada um."
              />
              <ResultsCarousel results={visibleResults} />
              <p className="mt-4 text-sm text-muted">Resultados individuais variam conforme dedicação, rotina e condições de cada pessoa.</p>
            </div>
          </section>
        )}

        {/* NO APP: o que a plataforma oferece (lista, não cartões) */}
        <section id="no-app" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-3xl font-bold sm:text-4xl">Seu treino na palma da mão</h2>
              <p className="mt-3 max-w-md text-soft sm:text-lg">
                Cada aluno recebe acesso à plataforma: a ficha, os vídeos, o registro de cada treino e a sua evolução,
                tudo pelo celular.
              </p>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {benefits.map((b) => {
                const Icon = BENEFIT_ICONS[b.icon as keyof typeof BENEFIT_ICONS];
                return (
                  <li key={b.title} className="grid grid-cols-[auto_1fr] gap-x-4 py-5">
                    <Icon aria-hidden className="mt-0.5 size-6 text-brand-ink" />
                    <div>
                      <p className="font-display text-lg font-semibold">{b.title}</p>
                      <p className="mt-0.5 text-soft">{b.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        {showTestimonials && visibleTestimonials.length > 0 && (
          <section id="depoimentos" className="scroll-mt-16 border-y border-line bg-card py-16 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionTitle title="O que dizem os alunos" />
              <ul className="grid gap-10 md:grid-cols-3 md:gap-8">
                {visibleTestimonials.map((t, i) => (
                  <li key={i}>
                    <figure className="flex h-full flex-col border-t border-chrome/50 pt-6">
                      <span aria-hidden className="font-display text-5xl font-bold leading-[0.5] text-brand-ink">“</span>
                      <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-strong">{t.quote}</blockquote>
                      <figcaption className="mt-6 flex items-center justify-between gap-2">
                        <span>
                          <span className="block font-semibold">{t.name}</span>
                          <span className="block text-sm text-muted">{t.detail}</span>
                        </span>
                        <ExampleTag show={t.example} />
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* CONTATO */}
        <section id="contato" className="theme-dark scroll-mt-16 bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-3xl text-4xl font-bold sm:text-5xl">Vamos começar?</h2>
            <p className="mt-4 max-w-xl text-soft sm:text-lg">
              Responda quatro perguntas rápidas e continue a conversa comigo no WhatsApp para montarmos o seu
              acompanhamento.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quero-ser-aluno" className={`${btnPrimaryCls} !w-auto px-6`}>
                Quero me tornar aluno
              </Link>
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

            </div>
            {contact.city && (
              <p className="mt-6 flex items-center gap-2 text-soft">
                <MapPin aria-hidden className="size-4 text-brand-ink" /> {contact.city}
              </p>
            )}
          </div>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="theme-dark border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            {BRAND.logoFull ? (
              <span className="inline-block rounded-2xl bg-white px-4 py-3">
                <Image src={BRAND.logoFull.src} alt={BRAND.logoFull.alt} width={BRAND.logoFull.width} height={BRAND.logoFull.height} className="h-20 w-auto" />
              </span>
            ) : (
              <div className="flex items-center gap-2.5">
                <BrandMark size="md" />
                <span className="font-display font-semibold">{BRAND.name}</span>
              </div>
            )}
            <p className="mt-4 max-w-sm text-sm text-soft">{BRAND.tagline}</p>
            <div className="mt-5 flex gap-2">
              {contact.instagram && (
                <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-11 place-items-center rounded-[10px] border border-line text-soft transition-colors hover:border-chrome hover:text-ink">
                  <InstagramIcon />
                </a>
              )}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid size-11 place-items-center rounded-[10px] border border-line text-soft transition-colors hover:border-chrome hover:text-ink">
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          </div>
          <nav aria-label="Links do rodapé">
            <p className="mb-3 font-display text-sm font-semibold">Navegação</p>
            <ul className="space-y-2 text-sm text-soft">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-ink">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="mb-3 font-display text-sm font-semibold">Plataforma</p>
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
