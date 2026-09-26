export const DIFFICULTY_LABEL: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const PLAN_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-zinc-200 text-strong dark:bg-zinc-800" },
  ativo: { label: "Ativo", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" },
  encerrado: { label: "Encerrado", cls: "bg-zinc-200 text-strong dark:bg-zinc-800" },
  arquivado: { label: "Arquivado", cls: "bg-zinc-200 text-strong dark:bg-zinc-800" },
};

export function repsLabel(min: number | null, max: number | null, text: string | null) {
  if (text) return text;
  if (min && max && min !== max) return `${min} a ${max}`;
  if (min) return `${min}`;
  return "—";
}

export type Technique = "normal" | "dropset" | "biset" | "restpause";

export const TECHNIQUE_LABEL: Record<Technique, string> = {
  normal: "Normal",
  dropset: "Drop set",
  biset: "Bi-set",
  restpause: "Rest-pause",
};

// Rótulo e dica do campo de detalhe, específicos de cada técnica.
export const TECHNIQUE_DETAIL_FIELD: Record<Technique, { label: string; placeholder: string } | null> = {
  normal: null,
  dropset: {
    label: "Quedas de carga",
    placeholder: "Ex.: 20 kg, depois 15 kg, depois 10 kg",
  },
  biset: {
    label: "Exercício combinado",
    placeholder: "Ex.: seguido, sem descanso, de Rosca direta com barra",
  },
  restpause: {
    label: "Padrão do rest-pause",
    placeholder: "Ex.: até falhar, descansar 15s, fazer mais 4 repetições, repetir 2 vezes",
  },
};

// Frase explicativa e didática, para o aluno ver na ficha e na execução do treino.
export function techniqueExplanation(technique: Technique, detail: string | null): string | null {
  if (technique === "normal") return null;
  const d = detail?.trim();
  switch (technique) {
    case "dropset":
      return `Drop set: ao falhar na carga inicial, reduza o peso imediatamente e continue${d ? ` (${d})` : ""}, sem descansar entre as quedas.`;
    case "biset":
      return `Bi-set: faça este exercício e, sem descansar, encadeie o próximo${d ? ` (${d})` : ""}. Só descanse depois dos dois.`;
    case "restpause":
      return `Rest-pause: ao falhar, faça uma pausa curta e continue por mais algumas repetições${d ? ` (${d})` : ""}.`;
  }
}
