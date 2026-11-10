import { CalendarCheck, ChartLine, CheckCircle2, ClipboardCheck, Dumbbell, NotebookPen, UserPlus } from "lucide-react";
import { LANDING } from "@/lib/landing-content";
import Reveal from "@/components/landing/reveal";
import SectionHeading from "@/components/landing/section-heading";
import LpButton from "@/components/landing/lp-button";
import s from "@/components/landing/landing.module.css";

const ICONS = {
  signup: UserPlus,
  assessment: ClipboardCheck,
  plan: NotebookPen,
  workout: Dumbbell,
  feedback: CalendarCheck,
  chart: ChartLine,
} as const;

// COMO FUNCIONA (#como-funciona): a jornada do aluno em etapas ligadas por uma linha que se enche
// de laranja ao rolar. Celular: linha à esquerda. Computador: linha no centro, etapas alternando
// de lado (zigue-zague). É uma sequência real, por isso os números.
export default function Journey({ index }: { index: number }) {
  const { journey } = LANDING;
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-title" className="relative scroll-mt-16 overflow-hidden py-24 sm:py-32">
      <div aria-hidden className={`absolute inset-0 ${s.gridBg}`} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            id="como-funciona-title"
            center
            index={index}
            label="Como funciona"
            title="Como funciona o acompanhamento"
            description="Do primeiro contato à evolução medida: cada etapa acontece com você e fica registrada no app."
          />
        </Reveal>

        <div className="relative mt-16">
          {/* trilho e preenchimento */}
          <div aria-hidden className="absolute bottom-6 left-6 top-6 w-0.5 -translate-x-1/2 bg-line-strong md:left-1/2">
            <div className={`size-full bg-gradient-to-b from-brand to-[#fb923c] ${s.lineFill}`} />
          </div>

          <ol className="relative space-y-6 md:space-y-4">
            {journey.map((step, i) => {
              const Icon = ICONS[step.icon as keyof typeof ICONS] ?? CheckCircle2;
              const right = i % 2 === 1; // no computador, etapas pares à direita
              return (
                <li key={step.title} className="relative grid grid-cols-[3rem_1fr] gap-5 md:grid-cols-[1fr_3rem_1fr] md:gap-8">
                  <div className="row-start-1 flex justify-center md:col-start-2">
                    <span
                      className={`relative z-[1] grid size-12 place-items-center rounded-full border border-brand bg-surface font-display text-base font-bold tabular-nums text-brand-ink ${s.stepNode}`}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <Reveal
                    from={right ? "right" : "left"}
                    delay={80}
                    className={`row-start-1 min-w-0 ${right ? "md:col-start-3" : "md:col-start-1"}`}
                  >
                    <div data-glow className={`${s.card} rounded-2xl border border-line bg-card/90 p-6 ${right ? "" : "md:text-right"}`}>
                      <div className={`flex items-center gap-3 ${right ? "" : "md:flex-row-reverse"}`}>
                        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                          <Icon className="size-5" />
                        </span>
                        <h3 className="text-xl font-bold">{step.title}</h3>
                      </div>
                      <p className="mt-3 leading-relaxed text-soft">{step.text}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <LpButton href="/quero-ser-aluno" size="lg">
            Quero ser aluno
          </LpButton>
          <p className="text-sm text-muted">Responda 4 perguntas rápidas e continue a conversa no WhatsApp.</p>
        </div>
      </div>
    </section>
  );
}
