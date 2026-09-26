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

export type AttendanceSummary = {
  planned: number; // dias combinados no período
  plannedElapsed: number; // dias combinados que já passaram (ou hoje, se já treinou)
  attendedPlanned: number; // dias combinados com treino concluído
  missed: number; // dias combinados que passaram sem treino ("Não foi")
  extraDays: number; // dias NÃO combinados com treino concluído
  completed: number; // total de treinos concluídos no período
};

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

// ISO: 1 = segunda ... 7 = domingo
function isoWeekday(date: string) {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

// Status de cada dia de uma lista de datas (semana ou mês).
// Antes de `since` (início do aluno) nenhum dia conta como combinado, para não gerar faltas falsas.
function buildDays(
  dates: string[],
  sessions: SessionRow[],
  trainingDays: number[],
  today: string,
  since?: string,
): AttendanceDay[] {
  const planned = new Set(trainingDays);
  return dates.map((date) => {
    const weekday = WEEKDAYS[isoWeekday(date) - 1];
    const daySessions = sessions
      .filter((s) => localDate(s.started_at) === date)
      .sort((a, b) => a.started_at.localeCompare(b.started_at))
      .map((s) => ({ ...s, dayStatus: sessionStatus(s, today) }));
    const isPlanned = planned.has(weekday.value) && (!since || date >= since);

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
}

function summarize(days: AttendanceDay[], today: string): AttendanceSummary {
  const done = (d: AttendanceDay) => d.status === "concluido";
  return {
    planned: days.filter((d) => d.planned).length,
    plannedElapsed: days.filter((d) => d.planned && (d.date < today || done(d))).length,
    attendedPlanned: days.filter((d) => d.planned && done(d)).length,
    missed: days.filter((d) => d.status === "faltou").length,
    extraDays: days.filter((d) => !d.planned && done(d)).length,
    completed: days.reduce((n, d) => n + d.sessions.filter((s) => s.status === "concluida").length, 0),
  };
}

export function buildAttendance(
  weekStart: string,
  sessions: SessionRow[],
  trainingDays: number[],
  today = todayIso(),
  since?: string,
): { days: AttendanceDay[]; summary: AttendanceSummary } {
  const days = buildDays(weekDays(weekStart), sessions, trainingDays, today, since);
  return { days, summary: summarize(days, today) };
}

// ---------------------------------------------------------------------
// Mês (formato "AAAA-MM")
// ---------------------------------------------------------------------
export function currentMonth() {
  return todayIso().slice(0, 7);
}

export function isValidMonth(ym: string | undefined): ym is string {
  return !!ym && /^\d{4}-(0[1-9]|1[0-2])$/.test(ym);
}

export function shiftMonth(ym: string, months: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 7);
}

export function monthDays(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
}

// Faixa de horários de vários meses seguidos (do 1º dia de `fromYm` ao último de `toYm`).
export function monthRange(fromYm: string, toYm = fromYm) {
  const last = monthDays(toYm).at(-1)!;
  return { from: `${fromYm}-01T00:00:00-03:00`, to: `${last}T23:59:59.999-03:00` };
}

export function formatMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const name = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${y}`;
}

export function buildMonth(
  ym: string,
  sessions: SessionRow[],
  trainingDays: number[],
  today = todayIso(),
  since?: string,
): { days: AttendanceDay[]; summary: AttendanceSummary } {
  const days = buildDays(monthDays(ym), sessions, trainingDays, today, since);
  return { days, summary: summarize(days, today) };
}

// Presença em % sobre os dias combinados que já passaram (null se não há como calcular).
export function attendanceRate(s: AttendanceSummary) {
  return s.plannedElapsed > 0 ? Math.round((s.attendedPlanned / s.plannedElapsed) * 100) : null;
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
