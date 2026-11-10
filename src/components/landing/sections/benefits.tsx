import { CalendarCheck, ChartLine, CheckCircle2, ClipboardCheck, MessageCircle, NotebookPen, Target } from "lucide-react";
import { LANDING } from "@/lib/landing-content";
import Reveal from "@/components/landing/reveal";
import SectionHeading from "@/components/landing/section-heading";
import s from "@/components/landing/landing.module.css";

const ICONS = {
  target: Target,
  assessment: ClipboardCheck,
  chat: MessageCircle,
  plan: NotebookPen,
  feedback: CalendarCheck,
  chart: ChartLine,
} as const;

// Largura de cada cartão no computador (3 colunas): 2,1 · 1,2 · 2,1 — grade de tamanhos variados.
const WIDE = [true, false, false, true, true, false];

// BENEFÍCIOS (#no-app: âncora antiga, mantida porque já foi divulgada).
export default function Benefits({ index }: { index: number }) {
  const { benefits } = LANDING;
  return (
    <section id="no-app" aria-labelledby="beneficios-title" className="relative scroll-mt-16 pb-24 pt-16 sm:pb-32 sm:pt-20">
      <div aria-hidden className={`absolute inset-0 ${s.gridBg}`} />
      <div aria-hidden className={`absolute inset-0 ${s.cornerGlow}`} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            id="beneficios-title"
            index={index}
            label="Benefícios"
            title={
              <>
                Tudo o que o seu treino precisa, <span className="text-brand">em um só acompanhamento.</span>
              </>
            }
            description="Cada aluno recebe um plano feito para ele e acesso à plataforma: ficha, vídeos, registro dos treinos e evolução, tudo pelo celular."
          />
        </Reveal>

        <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {benefits.map((b, i) => {
            const Icon = ICONS[b.icon as keyof typeof ICONS] ?? CheckCircle2;
            const wide = WIDE[i] ?? false;
            return (
              <Reveal as="li" key={b.title} delay={(i % 3) * 90} className={`h-full ${wide ? "lg:col-span-2" : ""}`}>
                <div
                  data-glow
                  className={`${s.card} flex h-full flex-col rounded-2xl border border-line bg-card/85 p-6 backdrop-blur-[2px] sm:p-7`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      aria-hidden
                      className="grid size-12 place-items-center rounded-xl border border-brand/30 bg-brand-soft text-brand-ink"
                    >
                      <Icon className="size-6" />
                    </span>
                    <span aria-hidden className="font-display text-sm font-bold tabular-nums text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold sm:text-2xl">{b.title}</h3>
                  <p className={`mt-2 leading-relaxed text-soft ${wide ? "lg:max-w-md" : ""}`}>{b.text}</p>
                  {wide && (
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute -bottom-6 right-4 hidden font-display text-[8rem] font-extrabold leading-none lg:block ${s.outlineNum}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
