import { todayIso } from "@/lib/assessment";
import { weekDays } from "@/lib/feedback";

// "Folha de ponto" do treino: cada sessão de treino (workout_sessions) é um check-in
// (started_at) e, quando finalizada, um check-out (finished_at).

const TZ = "America/Sao_Paulo";

// ISO: 1 = segunda ... 7 = domingo (mesma convenção de students.training_days)
export const WEEKDAYS: { value: number; short: string; long: string }[] = [
  { value: 1, short: "Seg", long: "Segunda" },
  { value: 2, short: "Ter", long: "Terça" },
  { value: 3, short: "Qua", long: "Quarta" },
  { value: 4, short: "Qui", long: "Quinta" },
  { value: 5, short: "Sex", long: "Sexta" },
  { value: 6, short: "Sáb", long: "Sábado" },
  { value: 7, short: "Dom", long: "Domingo" },
];

export type SessionRow = {
  id: string;
  workout_name_snapshot: string;
  started_at: string;
  finished_at: string | null;
  status: "em_andamento" | "concluida" | "abandonada";
};

export type DayStatus = "concluido" | "treinando" | "sem_checkout" | "faltou" | "hoje" | "previsto" | "folga";

export const STATUS_INFO: Record<DayStatus, { label: string; cls: string }> = {
  concluido: { label: "✅ Concluído", cls: "text-emerald-700 dark:text-emerald-400" },
  treinando: { label: "🏋️ Treinando", cls: "text-sky-700 dark:text-sky-400" },
  sem_checkout: { label: "⚠️ Sem check-out", cls: "text-amber-700 dark:text-amber-400" },
  faltou: { label: "❌ Não foi", cls: "text-red-700 dark:text-red-400" },
  hoje: { label: "Hoje", cls: "text-zinc-600 dark:text-zinc-400" },
  previsto: { label: "Previsto", cls: "text-zinc-500" },
  folga: { label: "Folga", cls: "text-zinc-400 dark:text-zinc-600" },
};

export type AttendanceDay = {
  date: string;
  weekday: (typeof WEEKDAYS)[number];
  planned: boolean;
  sessions: (SessionRow & { dayStatus: DayStatus })[];
  status: DayStatus;
};

export type AttendanceSummary = { planned: number; attendedPlanned: number; extraDays: number; completed: number };

// Data (AAAA-MM-DD) de um horário, no fuso do Brasil.
export function localDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

export function formatClock(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }) : "—";
}

// Faixa de horários da semana (segunda 00:00 a domingo 23:59, horário de Brasília) para filtrar no banco.
export function weekRange(weekStart: string) {
  const days = weekDays(weekStart);
  return { from: `${days[0]}T00:00:00-03:00`, to: `${days[6]}T23:59:59.999-03:00` };
}

function sessionStatus(s: SessionRow, today: string): DayStatus {
  if (s.status === "concluida") return "concluido";
  if (s.status === "em_andamento" && localDate(s.started_at) === today) return "treinando";
  return "sem_checkout";
}

export function buildAttendance(
  weekStart: string,
  sessions: SessionRow[],
  trainingDays: number[],
  today = todayIso(),
): { days: AttendanceDay[]; summary: AttendanceSummary } {
  const planned = new Set(trainingDays);
  const days = weekDays(weekStart).map((date, i) => {
    const weekday = WEEKDAYS[i];
    const daySessions = sessions
      .filter((s) => localDate(s.started_at) === date)
      .sort((a, b) => a.started_at.localeCompare(b.started_at))
      .map((s) => ({ ...s, dayStatus: sessionStatus(s, today) }));
    const isPlanned = planned.has(weekday.value);

    let status: DayStatus;
    if (daySessions.some((s) => s.dayStatus === "concluido")) status = "concluido";
    else if (daySessions.some((s) => s.dayStatus === "treinando")) status = "treinando";
    else if (daySessions.length > 0) status = "sem_checkout";
    else if (!isPlanned) status = "folga";
    else if (date < today) status = "faltou";
    else if (date === today) status = "hoje";
    else status = "previsto";

    return { date, weekday, planned: isPlanned, sessions: daySessions, status };
  });

  const done = (d: AttendanceDay) => d.status === "concluido";
  return {
    days,
    summary: {
      planned: days.filter((d) => d.planned).length,
      attendedPlanned: days.filter((d) => d.planned && done(d)).length,
      extraDays: days.filter((d) => !d.planned && done(d)).length,
      completed: sessions.filter((s) => s.status === "concluida").length,
    },
  };
}

export function summaryText(s: AttendanceSummary) {
  const base =
    s.planned > 0
      ? `${s.attendedPlanned} de ${s.planned} ${s.planned === 1 ? "dia combinado" : "dias combinados"}`
      : `${s.completed} ${s.completed === 1 ? "treino concluído" : "treinos concluídos"}`;
  return s.planned > 0 && s.extraDays > 0 ? `${base} · +${s.extraDays} extra` : base;
}

export function trainingDaysText(days: number[]) {
  if (days.length === 0) return "Dias de treino não definidos";
  return WEEKDAYS.filter((w) => days.includes(w.value))
    .map((w) => w.short)
    .join(", ");
}
