import { z } from "zod";

// "Quero me tornar aluno": perguntas, validação e a mensagem que vai para o WhatsApp.
// Usado no formulário público (/quero-ser-aluno) e na lista de Interessados do Personal.
// Os valores (ex.: "emagrecimento") são os mesmos aceitos pelo banco (migração 20260930000001).

export const GOALS = [
  { value: "emagrecimento", label: "Emagrecer" },
  { value: "hipertrofia", label: "Ganhar massa muscular" },
  { value: "condicionamento", label: "Melhorar o condicionamento" },
  { value: "saude", label: "Saúde e qualidade de vida" },
  { value: "outro", label: "Outro objetivo" },
] as const;

export const EXPERIENCES = [
  { value: "nunca", label: "Nunca treinei" },
  { value: "parei", label: "Já treinei, mas parei" },
  { value: "treino", label: "Treino atualmente" },
] as const;

export const DAYS = [2, 3, 4, 5, 6] as const;

export const MODALITIES = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "tanto_faz", label: "Tanto faz" },
] as const;

export const LEAD_STATUSES = [
  { value: "novo", label: "Novo" },
  { value: "em_conversa", label: "Em conversa" },
  { value: "virou_aluno", label: "Virou aluno" },
  { value: "nao_fechou", label: "Não fechou" },
] as const;

type Opt = readonly { value: string; label: string }[];
const labelOf = (opts: Opt, v: string) => opts.find((o) => o.value === v)?.label ?? v;
export const goalLabel = (v: string) => labelOf(GOALS, v);
export const experienceLabel = (v: string) => labelOf(EXPERIENCES, v);
export const modalityLabel = (v: string) => labelOf(MODALITIES, v);
export const statusLabel = (v: string) => labelOf(LEAD_STATUSES, v);

const values = <T extends Opt>(opts: T) => opts.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

// Telefone brasileiro: aceita "(11) 99999-9999", "11999999999", "+55 11 9...". Guarda "55" + DDD + número.
export function normalizeBrPhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1); // 0 de discagem (ex.: 011...)
  if (!/^[1-9][0-9]{9,10}$/.test(d)) return null;
  return `55${d}`;
}

export function formatBrPhone(stored: string): string {
  const d = stored.startsWith("55") ? stored.slice(2) : stored;
  const ddd = d.slice(0, 2);
  const n = d.slice(2);
  return n.length === 9 ? `(${ddd}) ${n.slice(0, 5)}-${n.slice(5)}` : `(${ddd}) ${n.slice(0, 4)}-${n.slice(4)}`;
}

export const leadSchema = z.object({
  goal: z.enum(values(GOALS), { error: "Escolha o seu objetivo." }),
  experience: z.enum(values(EXPERIENCES), { error: "Conte sua experiência com treino." }),
  daysPerWeek: z.coerce.number({ error: "Escolha quantos dias por semana." }).int().min(1).max(7),
  modality: z.enum(values(MODALITIES), { error: "Escolha online ou presencial." }),
  fullName: z
    .string()
    .trim()
    .min(2, "Escreva seu nome.")
    .max(120, "Nome muito longo."),
  whatsapp: z
    .string()
    .transform((v, ctx) => {
      const n = normalizeBrPhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "WhatsApp inválido. Use DDD + número, ex.: (11) 99999-9999." });
        return z.NEVER;
      }
      return n;
    }),
  privacy: z.literal(true, { error: "Para enviar, confirme que leu a Política de Privacidade." }),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

// Texto pronto que o interessado manda no WhatsApp do Personal.
export function leadMessage(l: Pick<Lead, "fullName" | "goal" | "experience" | "daysPerWeek" | "modality">, personalFirstName: string) {
  return [
    `Olá, ${personalFirstName}! Sou ${l.fullName} e quero me tornar seu aluno(a).`,
    `• Objetivo: ${goalLabel(l.goal)}`,
    `• Experiência: ${experienceLabel(l.experience)}`,
    `• Posso treinar ${l.daysPerWeek} dias por semana`,
    `• Prefiro: ${modalityLabel(l.modality)}`,
    `Vim pelo site.`,
  ].join("\n");
}

export const whatsappLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
