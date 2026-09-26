import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cardCls } from "@/lib/ui";

// Card padrão do sistema. `href` transforma o card inteiro em link (com seta e hover).
export function Card({
  children,
  className = "",
  href,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  padded?: boolean;
}) {
  const base = `${cardCls} ${padded ? "p-4 sm:p-5" : ""} ${className}`;
  if (href) {
    return (
      <Link
        href={href}
        className={`${base} group block transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_10px_30px_-16px_rgb(0_0_0/0.5)]`}
      >
        {children}
      </Link>
    );
  }
  return <div className={base}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-semibold leading-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Linha clicável dentro de listas (aluno, ficha, conversa...).
export function ListLink({
  href,
  children,
  aside,
}: {
  href: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${cardCls} flex items-center justify-between gap-3 p-4 transition hover:border-line-strong hover:bg-subtle`}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {aside}
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
    </Link>
  );
}
