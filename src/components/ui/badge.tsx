// Etiqueta de status. Sempre com texto (nunca só cor) — o ícone/ponto é reforço.
const TONES = {
  neutral: "bg-subtle-strong text-soft",
  brand: "bg-brand-soft text-brand-ink",
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  danger: "bg-red-500/12 text-red-700 dark:text-red-400",
  info: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  children,
  dot = false,
  className = "",
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className}`}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
