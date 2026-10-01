import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Cabeçalho de página: título, descrição, ações e (opcional) link de voltar.
export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
}: {
  title?: React.ReactNode; // vazio = a página desenha o próprio título
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  eyebrow?: string; // contexto curto acima do título (data, semana, "Ficha de Ana"); nunca repita o menu
}) {
  return (
    <header className="mb-6 space-y-3">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="mb-0.5 text-sm font-medium text-soft">{eyebrow}</p>}
          {title && <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>}
          {description && <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
