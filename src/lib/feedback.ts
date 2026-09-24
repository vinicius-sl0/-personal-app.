import type { Database } from "@/types/database.types";
import { todayIso } from "@/lib/assessment";

// Regras e rótulos do FEEDBACK SEMANAL (tabela weekly_checkins), usados no servidor e no navegador.
// Não confundir com o check-in/check-out diário do treino (workout_sessions).

export type Feedback = Pick<
  Database["public"]["Tables"]["weekly_checkins"]["Row"],
  | "id"
  | "student_id"
  | "week_start"
  | "training_feeling"
  | "energy"
  | "diet_adherence"
  | "progress_feeling"
  | "difficulties"
  | "pain_notes"
  | "comment"
  | "sleep_quality"
  | "stress"
  | "submitted_at"
  | "personal_reply"
  | "replied_at"
>;

export const FEEDBACK_COLUMNS =
  "id, student_id, week_start, training_feeling, energy, diet_adherence, progress_feeling, difficulties, pain_notes, comment, sleep_quality, stress, submitted_at, personal_reply, replied_at";

export type ScaleField = "training_feeling" | "energy" | "diet_adherence" | "progress_feeling";
type LegacyScaleField = "sleep_quality" | "stress";

type Scale<F extends string> = { field: F; label: string; levels: string[]; higherIsBetter: boolean };

// Perguntas de 1 a 5 feitas hoje. `higherIsBetter` define a cor ao exibir.
export const SCALES: Scale<ScaleField>[] = [
  { field: "training_feeling", label: "Como você se sentiu durante os treinos?", levels: ["Muito mal", "Mal", "Normal", "Bem", "Muito bem"], higherIsBetter: true },
  { field: "energy", label: "Como está sua disposição?", levels: ["Muito baixa", "Baixa", "Normal", "Boa", "Ótima"], higherIsBetter: true },
  { field: "diet_adherence", label: "Como está sua alimentação?", levels: ["Muito ruim", "Ruim", "Regular", "Boa", "Ótima"], higherIsBetter: true },
  { field: "progress_feeling", label: "Como você sente seu progresso?", levels: ["Nenhum", "Pouco", "Razoável", "Bom", "Ótimo"], higherIsBetter: true },
];

// Perguntas que existiam antes: não são mais feitas, mas aparecem no histórico se tiverem valor.
export const LEGACY_SCALES: Scale<LegacyScaleField>[] = [
  { field: "sleep_quality", label: "Sono", levels: ["Péssimo", "Ruim", "Regular", "Bom", "Ótimo"], higherIsBetter: true },
  { field: "stress", label: "Estresse", levels: ["Muito baixo", "Baixo", "Médio", "Alto", "Muito alto"], higherIsBetter: false },
];

export const TEXT_MAX = 1000;

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Segunda-feira da semana de uma data (formato AAAA-MM-DD).
export function weekStartOf(iso: string) {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = domingo
  return addDays(iso, -((day + 6) % 7));
}

// Semana atual no fuso do Brasil.
export function currentWeekStart() {
  return weekStartOf(todayIso());
}

export function weekEndOf(weekStart: string) {
  return addDays(weekStart, 6);
}

export function shiftWeek(weekStart: string, weeks: number) {
  return addDays(weekStart, weeks * 7);
}

export function weekDays(weekStart: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function formatWeek(weekStart: string) {
  return `Semana de ${shortDate(weekStart)} a ${shortDate(weekEndOf(weekStart))}`;
}
