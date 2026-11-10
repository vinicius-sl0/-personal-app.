import { LANDING } from "@/lib/landing-content";
import Reveal from "@/components/landing/reveal";
import SectionHeading from "@/components/landing/section-heading";
import ResultsShowcase from "@/components/landing/results-showcase";
import LpButton from "@/components/landing/lp-button";
import s from "@/components/landing/landing.module.css";

type Result = (typeof LANDING.results)[number];

// RESULTADOS (#resultados). Só resultados reais e autorizados chegam aqui (o filtro fica no page.tsx).
export default function Results({ index, results }: { index: number; results: Result[] }) {
  return (
    <section id="resultados" aria-labelledby="resultados-title" className="relative scroll-mt-16 overflow-hidden py-24 sm:py-32">
      <div aria-hidden className={`absolute inset-0 ${s.gridBg}`} />
      <div aria-hidden className="absolute -right-40 top-1/3 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(249_115_22/0.12),transparent)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            id="resultados-title"
            index={index}
            label="Resultados"
            title="Resultados que falam por si."
            description="Alunos que confiaram no processo. Publicados somente com a autorização de cada um. Arraste a divisória para comparar."
          />
        </Reveal>

        <Reveal className="mt-14">
          <ResultsShowcase results={results} />
        </Reveal>

        <div className="mt-14 flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm text-muted">
            Resultados individuais variam conforme dedicação, rotina e condições de cada pessoa.
          </p>
          <LpButton href="/quero-ser-aluno">Quero ser aluno</LpButton>
        </div>
      </div>
    </section>
  );
}
