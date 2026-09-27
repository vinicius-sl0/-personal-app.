import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL, legalIsComplete } from "@/lib/legal";
import { formatDate } from "@/lib/assessment";

// Estrutura comum das páginas /termos e /privacidade: título, data, sumário e seções numeradas.

export type LegalSection = { id: string; title: string; body: React.ReactNode };

// Valor vindo de src/lib/legal.ts; se ainda não foi preenchido, aparece destacado.
export function Fill({ value, hint }: { value: string | null; hint: string }) {
  if (value) return <>{value}</>;
  return (
    <mark className="rounded bg-amber-500/20 px-1 text-amber-900 dark:text-amber-100">[a preencher: {hint}]</mark>
  );
}

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  const complete = legalIsComplete();
  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          Voltar ao início
        </Link>

        <header className="mt-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted">Última atualização: {formatDate(LEGAL.updatedAt)}</p>
        </header>

        {!complete && (
          <p role="note" className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            <strong>Rascunho.</strong> Os trechos marcados “a preencher” ainda precisam dos dados do Personal, e o
            texto deve ser revisado por um advogado antes de valer para alunos reais.
          </p>
        )}

        <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-soft">{intro}</div>

        <nav aria-label="Sumário" className="mt-8 rounded-2xl border border-line bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-ink">Nesta página</p>
          <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted transition hover:text-brand-ink">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-6 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                {i + 1}. {s.title}
              </h2>
              <div className="legal-body space-y-3 text-[15px] leading-relaxed text-soft">{s.body}</div>
            </section>
          ))}
        </div>

        <footer className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm text-muted">
          <Link href="/termos" className="hover:text-ink">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="hover:text-ink">
            Política de Privacidade
          </Link>
        </footer>
      </div>
    </main>
  );
}
