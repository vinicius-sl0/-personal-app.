export const DIFFICULTY_LABEL: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const PLAN_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  ativo: { label: "Ativo", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" },
  encerrado: { label: "Encerrado", cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  arquivado: { label: "Arquivado", cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

export function repsLabel(min: number | null, max: number | null, text: string | null) {
  if (text) return text;
  if (min && max && min !== max) return `${min} a ${max}`;
  if (min) return `${min}`;
  return "—";
}
