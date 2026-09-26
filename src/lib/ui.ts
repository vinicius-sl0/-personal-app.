// Classes Tailwind reutilizadas (mobile-first: alvos de toque ≥ 44px, foco visível).
// Cores sempre por token de tema (ver src/app/globals.css).

export const inputCls =
  "h-12 w-full rounded-xl border border-field bg-card px-3.5 text-base text-ink placeholder:text-muted outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:opacity-60 aria-[invalid=true]:border-red-500";

export const labelCls = "text-sm font-medium text-strong";

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const btnPrimaryCls = `${btnBase} h-12 w-full bg-brand text-base text-brand-contrast shadow-[0_6px_20px_-8px_rgb(249_115_22/0.6)] hover:bg-brand-hover`;

export const btnSecondaryCls = `${btnBase} h-11 border border-line-strong bg-card px-4 text-sm text-ink hover:border-field hover:bg-subtle`;

export const btnGhostCls = `${btnBase} h-10 px-3 text-sm text-soft hover:bg-subtle hover:text-ink`;

export const btnDangerCls = `${btnBase} h-11 border border-red-500/40 bg-card px-4 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400`;

export const errorCls =
  "rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300";

export const successCls =
  "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-800 dark:text-emerald-300";

export const cardCls = "rounded-2xl border border-line bg-card";
