import Link from "next/link";
import { cardCls } from "@/lib/ui";

// Indicador numérico de resumo (dashboard). Se `href`, o card inteiro vira atalho.
export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  highlight?: boolean; // destaca em laranja (ex.: há algo pendente)
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {icon && (
          <span
            aria-hidden
            className={`grid size-8 place-items-center rounded-lg ${highlight ? "bg-brand text-brand-contrast" : "bg-subtle text-soft"}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = `${cardCls} block p-4 sm:p-5 ${highlight ? "border-brand/40" : ""}`;
  return href ? (
    <Link href={href} className={`${cls} transition hover:-translate-y-0.5 hover:border-line-strong`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
