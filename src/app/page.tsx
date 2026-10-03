import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  LineChart,
  ListChecks,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  PlayCircle,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { LANDING } from "@/lib/landing-content";
import { btnPrimaryCls } from "@/lib/ui";
import ResultsCarousel from "@/components/landing/results-carousel";
import { ExampleTag } from "@/components/landing/example-tag";
import { InstagramIcon, WhatsAppIcon } from "@/components/landing/social-icons";
import { BrandMark } from "@/components/brand-mark";
import LandingHeader from "@/components/landing/landing-header";
import Reveal from "@/components/landing/reveal";
import Faq from "@/components/landing/faq";

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
  { href: "#duvidas", label: "Dúvidas" },
  { href: "#contato", label: "Contato" },
];

const btnOutlineCls =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-line-strong px-6 font-display text-base font-semibold text-ink transition-colors hover:border-chrome hover:bg-subtle";

// Botão de contorno escuro, sobre a faixa laranja da chamada final.
const darkOutlineCls =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-black/30 px-4 font-display text-sm font-semibold text-black transition-colors hover:bg-black/10";

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

function SectionTitle({
  title,
  description,
  aside,
  center = false,
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 ${center ? "mx-auto max-w-2xl flex-col text-center" : "max-w-3xl"}`}
    >
      <div>
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 max-w-2xl text-soft sm:text-lg">{description}</p>}
      </div>
      {aside}
    </div>
  );
}

// Ícone de cada passo de "Como eu trabalho" (avaliação → planejamento → acompanhamento).
const STEP_ICONS = [ClipboardCheck, NotebookPen, LineChart];

// Chamada repetida entre as seções, como em página de venda: sempre o mesmo destino do cadastro.
function CtaBand() {
  return (
    <div className="mt-12 flex flex-col items-center gap-3 text-center">
      <Link href="/quero-ser-aluno" className={`${btnPrimaryCls} !h-14 !w-auto px-8 !text-lg`}>
        Quero me tornar aluno
      </Link>
      <p className="text-sm text-muted">Responda 4 perguntas rápidas e fale comigo pelo WhatsApp.</p>
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
    // Página pública sempre escura (identidade preto + laranja), independente do tema do aparelho.
    <div className="theme-dark min-h-dvh bg-surface text-ink">
      {LANDING.draft && (
        <p className="bg-amber-400 px-4 py-2 text-center text-xs font-medium text-black">
          Página em construção: textos e imagens marcados como “Exemplo” serão trocados pelo conteúdo real.
        </p>
      )}

      <LandingHeader nav={nav} />

      <main>
        {/* PRIMEIRA TELA: foto da Personal ocupando a tela, nome grande e os dois caminhos
            (novo aluno → /quero-ser-aluno, quem já é aluno → /login). Fica por baixo do topo. */}
        <section className="theme-dark relative -mt-16 flex min-h-[100svh] items-end overflow-hidden bg-surface lg:min-h-[760px] lg:items-center">
          <div aria-hidden className="absolute inset-x-0 top-0 h-[72svh] sm:h-[78svh] lg:inset-y-0 lg:left-auto lg:h-auto lg:w-[60%]">
            {hero.photo ? (
              <Image
                src={hero.photo.src}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover object-[50%_22%]"
              />
            ) : (
              <div className="grid h-full place-items-center bg-card text-muted">
                <UserRound className="size-24 opacity-30" />
              </div>
            )}
            {/* Letreiro vermelho da academia no alto da foto: preto e branco e escurecido, para não
                competir com o laranja da marca (o rosto, mais abaixo, mantém a cor). */}
            <div className="absolute inset-x-0 top-0 h-[24%] backdrop-brightness-[0.45] backdrop-grayscale [mask-image:linear-gradient(to_bottom,black_65%,transparent)]" />
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-surface/80 to-transparent" />
            {/* Celular/tablet: a foto fica em cima (rosto livre) e se funde com o preto onde começa o texto */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface via-surface/85 to-transparent lg:hidden" />
            {/* Computador: funde a foto com o preto à esquerda, onde fica o texto */}
            <div className="absolute inset-y-0 left-0 hidden w-3/5 bg-gradient-to-r from-surface via-surface/70 to-transparent lg:block" />
            <div className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-gradient-to-t from-surface to-transparent lg:block" />
          </div>
          {hero.photo && <span className="sr-only">{hero.photo.alt}</span>}

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-[46svh] sm:px-6 sm:pb-14 sm:pt-[52svh] lg:py-32">
            <div className="max-w-2xl">
              <div className="max-w-sm motion-safe:animate-slide-up">
                <TrainerRule />
              </div>
              <h1
                className={`${wideCls} mt-4 text-[clamp(2.6rem,12.5vw,5.75rem)] font-bold leading-[0.88] tracking-[-0.02em] motion-safe:animate-slide-up lg:text-[6.5rem]`}
                style={{ animationDelay: "60ms" }}
              >
                <span className="block">{firstName}</span>
                {lastName && <span className="block text-chrome">{lastName}</span>}
              </h1>
              <p
                className="mt-6 max-w-xl text-2xl font-semibold leading-snug text-ink motion-safe:animate-slide-up sm:text-[1.75rem]"
                style={{ animationDelay: "120ms" }}
              >
                {hero.headline}
              </p>
              <p className="mt-3 max-w-xl text-base text-soft motion-safe:animate-slide-up sm:text-lg" style={{ animationDelay: "160ms" }}>
                {hero.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 motion-safe:animate-slide-up sm:flex-row" style={{ animationDelay: "200ms" }}>
                <Link href="/quero-ser-aluno" className={`${btnPrimaryCls} !h-14 !text-lg sm:!w-auto sm:px-8`}>
                  Quero me tornar aluno
                </Link>
                <Link href="/login" className={`${btnOutlineCls} !h-14`}>
                  Já sou aluno
                </Link>
              </div>
            </div>

            {/* Prova social: só os números do conteúdo (com "Exemplo" enquanto não forem os reais) */}
            <div className="mt-10 max-w-2xl border-t border-line pt-5 motion-safe:animate-slide-up" style={{ animationDelay: "260ms" }}>
              <dl className="grid grid-cols-3 divide-x divide-line">
                {about.stats.map((st, i) => (
                  <div key={st.label} className={`flex flex-col ${i === 0 ? "pr-3" : "px-3 sm:px-6"}`}>
                    <dt className="order-2 mt-1 text-xs leading-tight text-muted">{st.label}</dt>
                    <dd className={`order-1 text-xl font-bold leading-none text-brand-ink sm:text-2xl ${wideCls}`}>{st.value}</dd>
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
        </section>

        {/* SOBRE: história + coluna de credenciais (CREF, números, especialidades) */}
        <section id="sobre" className="scroll-mt-16 border-t border-line py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <SectionTitle title={about.title} aside={<ExampleTag show={about.example} />} />
            </Reveal>
            <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
              <Reveal className="space-y-6">
                <div className="max-w-[65ch] space-y-4 text-lg leading-relaxed text-strong">
                  {about.story.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <blockquote className="max-w-[60ch] border-l-4 border-brand pl-5 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
                  {about.goals}
                </blockquote>
              </Reveal>

              <Reveal delay={120}>
                <aside aria-label="Credenciais" className="rounded-2xl border border-line bg-card p-5 sm:p-6">
                  <div className="flex items-center gap-3 border-b border-line pb-5">
                    <BrandMark size="lg" />
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold leading-tight">{BRAND.name}</p>
                      <p className="text-sm text-muted">Personal Trainer</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 divide-x divide-line py-5">
                    {about.stats.map((st, i) => (
                      <div key={st.label} className={`flex flex-col ${i === 0 ? "pr-3" : "px-3"}`}>
                        <dt className="order-2 mt-1.5 text-xs leading-tight text-muted">{st.label}</dt>
                        <dd className={`order-1 text-2xl font-bold leading-none text-brand-ink ${wideCls}`}>{st.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="border-t border-line pt-5">
                    <h3 className="mb-3 text-sm font-semibold text-soft">Especialidades</h3>
                    <ul className="flex flex-wrap gap-2">
                      {about.specialties.map((sp) => (
                        <li key={sp} className="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-sm font-medium">
                          {sp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </Reveal>
            </div>

            {/* Como eu trabalho: é uma sequência de verdade, por isso os passos numerados */}
            <Reveal>
              <h3 className="mb-8 mt-20 text-center text-2xl font-bold sm:text-3xl">Como eu trabalho</h3>
            </Reveal>
            <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
              {about.methodology.map((m, i) => {
                const Icon = STEP_ICONS[i] ?? ListChecks;
                const accent = i % 2 === 0;
                return (
                  <Reveal as="li" key={m.title} delay={i * 100} className="h-full">
                    <div
                      className={`relative flex h-full flex-col rounded-2xl border p-6 transition-transform duration-300 hover:-translate-y-1 ${
                        accent ? "border-brand bg-brand text-brand-contrast" : "border-line-strong bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          aria-hidden
                          className={`grid size-12 place-items-center rounded-[10px] ${accent ? "bg-black/15" : "bg-brand-soft text-brand-ink"}`}
                        >
                          <Icon className="size-6" />
                        </span>
                        <span className={`font-display text-sm font-bold ${accent ? "text-black/60" : "text-muted"}`}>
                          Passo {i + 1}
                        </span>
                      </div>
                      <p className="mt-5 font-display text-xl font-bold">{m.title}</p>
                      <p className={`mt-2 leading-relaxed ${accent ? "text-black/80" : "text-soft"}`}>{m.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </section>

        {/* RESULTADOS */}
        {visibleResults.length > 0 && (
          <section id="resultados" className="scroll-mt-16 border-t border-line bg-card/40 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <Reveal>
                <SectionTitle
                  center
                  title="Resultados reais"
                  description="Alunos que confiaram no processo. Publicados somente com autorização de cada um."
                />
              </Reveal>
              <Reveal>
                <ResultsCarousel results={visibleResults} />
              </Reveal>
              <p className="mt-6 text-center text-sm text-muted">
                Resultados individuais variam conforme dedicação, rotina e condições de cada pessoa.
              </p>
              <CtaBand />
            </div>
          </section>
        )}

        {/* O QUE VOCÊ RECEBE: o que a plataforma realmente oferece */}
        <section id="no-app" className="scroll-mt-16 border-t border-line py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.35fr] lg:items-center lg:gap-16">
            <Reveal>
              <h2 className="text-3xl font-bold sm:text-4xl">O que você recebe no acompanhamento</h2>
              <p className="mt-4 max-w-md text-soft sm:text-lg">
                Cada aluno recebe acesso à plataforma: a ficha, os vídeos, o registro de cada treino e a sua evolução,
                tudo pelo celular.
              </p>
              <Link href="/quero-ser-aluno" className={`${btnPrimaryCls} mt-8 !w-auto px-7`}>
                Quero me tornar aluno
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <ul className="overflow-hidden rounded-2xl border border-line bg-card">
                {benefits.map((b, i) => {
                  const Icon = BENEFIT_ICONS[b.icon as keyof typeof BENEFIT_ICONS] ?? CheckCircle2;
                  return (
                    <li
                      key={b.title}
                      className={`grid grid-cols-[auto_1fr] gap-x-4 p-5 transition-colors hover:bg-subtle ${i > 0 ? "border-t border-line" : ""}`}
                    >
                      <span aria-hidden className="grid size-11 place-items-center rounded-[10px] bg-brand-soft text-brand-ink">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="font-display text-lg font-semibold">{b.title}</p>
                        <p className="mt-0.5 text-soft">{b.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        {showTestimonials && visibleTestimonials.length > 0 && (
          <section id="depoimentos" className="scroll-mt-16 border-t border-line bg-card/40 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <Reveal>
                <SectionTitle center title="O que dizem os alunos" />
              </Reveal>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTestimonials.map((t, i) => (
                  <Reveal as="li" key={i} delay={i * 100} className="h-full">
                    <figure className="flex h-full flex-col rounded-2xl border border-line bg-card p-6 transition-colors hover:border-brand/50">
                      <span aria-hidden className="font-display text-6xl font-bold leading-[0.6] text-brand-ink">“</span>
                      <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-strong">{t.quote}</blockquote>
                      <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                        <span
                          aria-hidden
                          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft font-display font-bold text-brand-ink"
                        >
                          {t.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{t.name}</span>
                          <span className="block text-sm text-muted">{t.detail}</span>
                        </span>
                        <ExampleTag show={t.example} />
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* PERGUNTAS FREQUENTES (só sobre o funcionamento que já existe) */}
        <section id="duvidas" className="scroll-mt-16 border-t border-line py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <SectionTitle center title="Perguntas frequentes" description="O que costuma surgir antes de começar." />
            </Reveal>
            <Reveal>
              <Faq />
            </Reveal>
          </div>
        </section>

        {/* CHAMADA FINAL: faixa laranja com o cadastro e os outros contatos configurados */}
        <section id="contato" className="scroll-mt-16 bg-brand text-brand-contrast">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
            <Reveal className="max-w-2xl">
              <h2 className="text-4xl font-bold sm:text-5xl">Vamos começar?</h2>
              <p className="mt-4 text-lg text-black/75">
                Responda quatro perguntas rápidas e continue a conversa comigo no WhatsApp para montarmos o seu
                acompanhamento.
              </p>
              {contact.city && (
                <p className="mt-4 flex items-center gap-2 text-black/75">
                  <MapPin aria-hidden className="size-4" /> {contact.city}
                </p>
              )}
            </Reveal>
            <Reveal delay={100} className="flex w-full flex-col gap-3 sm:w-auto">
              <Link
                href="/quero-ser-aluno"
                className="inline-flex h-14 items-center justify-center rounded-[10px] bg-surface px-8 font-display text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5 active:translate-y-px"
              >
                Quero me tornar aluno
              </Link>
              <div className="flex flex-wrap gap-2">
                {contact.instagram && (
                  <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className={darkOutlineCls}>
                    <InstagramIcon /> Instagram
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className={darkOutlineCls}>
                    <Mail aria-hidden className="size-5" /> E-mail
                  </a>
                )}
                {contact.others.map((o) => (
                  <a key={o.href} href={o.href} target="_blank" rel="noopener noreferrer" className={darkOutlineCls}>
                    {o.label}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="border-t border-line bg-surface">
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
                <Link href="/quero-ser-aluno" className="font-medium text-brand-ink hover:underline">
                  Quero me tornar aluno
                </Link>
              </li>
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
