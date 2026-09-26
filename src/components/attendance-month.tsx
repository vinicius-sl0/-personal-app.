import {
  attendanceRate,
  formatClock,
  STATUS_INFO,
  WEEKDAYS,
  type AttendanceDay,
  type AttendanceSummary,
  type DayStatus,
} from "@/lib/attendance";
import { shortDate } from "@/lib/feedback";

// Cor de cada dia no calendário do mês.
const CELL: Record<DayStatus, string> = {
  concluido: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100",
  treinando: "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100",
  sem_checkout: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
  faltou: "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-100",
  hoje: "border-2 border-zinc-900 dark:border-zinc-100",
  previsto: "border border-dashed border-zinc-400 dark:border-zinc-600",
  folga: "text-zinc-400 dark:text-zinc-600",
};

const ICON: Partial<Record<DayStatus, string>> = { concluido: "✅", treinando: "🏋️", sem_checkout: "⚠️", faltou: "❌" };

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

export function MonthSummaryCards({ summary, hasTrainingDays }: { summary: AttendanceSummary; hasTrainingDays: boolean }) {
  const rate = attendanceRate(summary);
  return (
    <div className="grid grid-cols-2 gap-2">
      {hasTrainingDays ? (
        <Card
          label="Presença"
          value={rate === null ? "—" : `${rate}%`}
          sub={`${summary.attendedPlanned} de ${summary.plannedElapsed} dias combinados`}
        />
      ) : (
        <Card label="Presença" value="—" sub="Dias combinados não definidos" />
      )}
      <Card label="Faltas" value={String(summary.missed)} />
      <Card label="Dias extras" value={String(summary.extraDays)} sub="Treinou fora dos dias combinados" />
      <Card label="Treinos concluídos" value={String(summary.completed)} />
    </div>
  );
}

export function MonthCalendar({ days }: { days: AttendanceDay[] }) {
  const leading = days.length > 0 ? days[0].weekday.value - 1 : 0; // começa na segunda
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-500">
        {WEEKDAYS.map((w) => (
          <span key={w.value}>{w.short}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`vazio-${i}`} />
        ))}
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.weekday.long}, ${shortDate(d.date)}: ${STATUS_INFO[d.status].label}`}
            aria-label={`${d.weekday.long}, ${shortDate(d.date)}: ${STATUS_INFO[d.status].label}`}
            className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs ${CELL[d.status]}`}
          >
            <span className="font-semibold">{Number(d.date.slice(8))}</span>
            {ICON[d.status] && (
              <span aria-hidden className="text-[10px] leading-none">
                {ICON[d.status]}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
        <span>✅ Concluído</span>
        <span>❌ Não foi</span>
        <span>⚠️ Sem check-out</span>
        <span>Cinza = folga</span>
        <span>Tracejado = previsto</span>
      </p>
    </div>
  );
}

export function MonthSessions({ days }: { days: AttendanceDay[] }) {
  const rows = days.flatMap((d) => d.sessions.map((s) => ({ d, s }))).reverse();
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum treino registrado neste mês.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map(({ d, s }) => (
        <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          <span className="min-w-0">
            <span className="block truncate font-medium">{s.workout_name_snapshot}</span>
            <span className="block text-xs text-zinc-500">
              {d.weekday.short}, {shortDate(d.date)} · check-in {formatClock(s.started_at)} · check-out {formatClock(s.finished_at)}
            </span>
          </span>
          <span className={`shrink-0 text-xs font-medium ${STATUS_INFO[s.dayStatus].cls}`}>{STATUS_INFO[s.dayStatus].label}</span>
        </li>
      ))}
    </ul>
  );
}
