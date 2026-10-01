// Classes Tailwind reutilizadas (mobile-first: alvos de toque ≥ 44px, foco visível).
// Cores sempre por token de tema (ver src/app/globals.css).
//
// Cantos com hierarquia (não o mesmo arredondado em tudo):
//   controles (botões, campos) → 10px · cartões → 16px · etiquetas/pílulas → redondo.
// Botões e títulos usam a fonte da marca (Saira, `font-display`); textos usam Barlow.

export const inputCls =
  "h-12 w-full rounded-[10px] border border-field bg-card px-3.5 text-base text-ink placeholder:text-muted outline-none transition-[border-color,box-shadow] focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-soft)] disabled:opacity-60 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgb(239_68_68/0.2)]";

export const labelCls = "text-sm font-medium text-strong";

export const btnBase =
  "inline-flex select-none items-center justify-center gap-2 rounded-[10px] font-display font-semibold tracking-[0.01em] transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

// Laranja da marca com texto preto (contraste 7:1). Brilho fino na borda de cima em vez de
// sombra colorida: dá o aspecto de peça "usinada", sem parecer botão de template.
export const btnPrimaryCls = `${btnBase} h-12 w-full bg-brand text-base text-brand-contrast shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_1px_2px_rgb(0_0_0/0.25)] hover:bg-brand-hover`;

export const btnSecondaryCls = `${btnBase} h-11 border border-line-strong bg-card px-4 text-sm text-ink hover:border-chrome/70 hover:bg-subtle`;

export const btnGhostCls = `${btnBase} h-10 px-3 text-sm text-soft hover:bg-subtle hover:text-ink`;

export const btnDangerCls = `${btnBase} h-11 border border-red-500/40 bg-card px-4 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400`;

export const errorCls =
  "rounded-[10px] border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium leading-snug text-red-700 dark:text-red-300";

export const successCls =
  "rounded-[10px] border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium leading-snug text-emerald-800 dark:text-emerald-300";

export const cardCls = "rounded-2xl border border-line bg-card";

// Números grandes (placares, indicadores, repetições e carga na execução do treino).
export const displayNumberCls = "font-display font-semibold tabular-nums tracking-[-0.01em]";

// Seletor segmentado (ex.: Planejado | Realizado, Semana | Mês): trilho em aço, opção ativa laranja.
export const segGroupCls = "flex gap-1 rounded-[10px] border border-line bg-steel/60 p-1";
export const segBtnCls = (on: boolean) =>
  `flex-1 whitespace-nowrap rounded-[7px] px-3 py-1.5 font-display text-sm font-semibold transition-colors ${
    on ? "bg-brand text-brand-contrast shadow-[inset_0_1px_0_rgb(255_255_255/0.28)]" : "text-soft hover:text-ink"
  }`;
