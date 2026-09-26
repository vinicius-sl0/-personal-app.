import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  attendanceRate,
  buildAttendance,
  buildMonth,
  currentMonth,
  formatMonth,
  isValidMonth,
  monthRange,
  shiftMonth,
  weekRange,
  type SessionRow,
} from "@/lib/attendance";
import { currentWeekStart, formatWeek, shiftWeek, weekStartOf } from "@/lib/feedback";
import { errorCls } from "@/lib/ui";
import AttendanceWeek from "@/components/attendance-week";
import { MonthCalendar, MonthSessions, MonthSummaryCards } from "@/components/attendance-month";

const SESSION_COLUMNS = "id, workout_name_snapshot, started_at, finished_at, status";
const HISTORY_MONTHS = 6;

export type AttendanceParams = { ver?: string; semana?: string; mes?: string };

// Frequência com abas "Semana | Mês". Usada pelo aluno (a própria) e pelo Personal (de um aluno).
// A RLS garante que cada um só lê as sessões que pode ver.
export default async function AttendanceView({
  studentId,
  trainingDays,
  since,
  basePath,
  params,
}: {
  studentId: string;
  trainingDays: number[];
  since: string; // data de início do aluno (students.start_date)
  basePath: string;
  params: AttendanceParams;
}) {
  const view = params.ver === "mes" ? "mes" : "semana";
  const supabase = await createClient();

  const tabCls = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium ${
      active ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-400"
    }`;
  const tabs = (
    <nav aria-label="Período" className="flex gap-1 rounded-xl border border-zinc-200 p-1 dark:border-zinc-800">
      <Link href={`${basePath}?ver=semana`} className={tabCls(view === "semana")} aria-current={view === "semana" ? "page" : undefined}>
        Semana
      </Link>
      <Link href={`${basePath}?ver=mes`} className={tabCls(view === "mes")} aria-current={view === "mes" ? "page" : undefined}>
        Mês
      </Link>
    </nav>
  );

  const navRow = (prevHref: string, label: string, nextHref: string | null) => (
    <div className="flex items-center justify-between gap-2">
      <Link href={prevHref} className="text-sm underline">
        ← Anterior
      </Link>
      <p className="text-center text-sm font-medium">{label}</p>
      {nextHref ? (
        <Link href={nextHref} className="text-sm underline">
          Próximo →
        </Link>
      ) : (
        <span className="w-16" />
      )}
    </div>
  );

  if (view === "semana") {
    const thisWeek = currentWeekStart();
    const requested = params.semana && /^\d{4}-\d{2}-\d{2}$/.test(params.semana) ? weekStartOf(params.semana) : thisWeek;
    const weekStart = requested > thisWeek ? thisWeek : requested;
    const range = weekRange(weekStart);

    const { data, error } = await supabase
      .from("workout_sessions")
      .select(SESSION_COLUMNS)
      .eq("student_id", studentId)
      .gte("started_at", range.from)
      .lte("started_at", range.to);
    const { days, summary } = buildAttendance(weekStart, (data ?? []) as SessionRow[], trainingDays, undefined, since);

    return (
      <div className="space-y-4">
        {tabs}
        {navRow(
          `${basePath}?ver=semana&semana=${shiftWeek(weekStart, -1)}`,
          weekStart === thisWeek ? "Esta semana" : formatWeek(weekStart),
          weekStart < thisWeek ? `${basePath}?ver=semana&semana=${shiftWeek(weekStart, 1)}` : null,
        )}
        {error ? (
          <p className={errorCls}>Não foi possível carregar os treinos: {error.message}</p>
        ) : (
          <AttendanceWeek days={days} summary={summary} />
        )}
      </div>
    );
  }

  // Mês: busca de uma vez o mês escolhido e os 5 anteriores (para o histórico).
  const thisMonth = currentMonth();
  const requested = isValidMonth(params.mes) ? params.mes : thisMonth;
  const month = requested > thisMonth ? thisMonth : requested;
  const firstMonth = shiftMonth(month, -(HISTORY_MONTHS - 1));
  const range = monthRange(firstMonth, month);

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_COLUMNS)
    .eq("student_id", studentId)
    .gte("started_at", range.from)
    .lte("started_at", range.to);
  const sessions = (data ?? []) as SessionRow[];
  const { days, summary } = buildMonth(month, sessions, trainingDays, undefined, since);
  const history = Array.from({ length: HISTORY_MONTHS }, (_, i) => shiftMonth(month, -i)).map((ym) => ({
    ym,
    summary: buildMonth(ym, sessions, trainingDays, undefined, since).summary,
  }));
  const hasTrainingDays = trainingDays.length > 0;

  return (
    <div className="space-y-4">
      {tabs}
      {navRow(
        `${basePath}?ver=mes&mes=${shiftMonth(month, -1)}`,
        formatMonth(month),
        month < thisMonth ? `${basePath}?ver=mes&mes=${shiftMonth(month, 1)}` : null,
      )}

      {error ? (
        <p className={errorCls}>Não foi possível carregar os treinos: {error.message}</p>
      ) : (
        <>
          <MonthSummaryCards summary={summary} hasTrainingDays={hasTrainingDays} />
          <MonthCalendar days={days} />

          <h3 className="font-semibold">Treinos do mês</h3>
          <MonthSessions days={days} />

          <h3 className="font-semibold">Últimos {HISTORY_MONTHS} meses</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Mês</th>
                  <th scope="col" className="px-3 py-2 font-medium">Presença</th>
                  <th scope="col" className="px-3 py-2 font-medium">Faltas</th>
                  <th scope="col" className="px-3 py-2 font-medium">Treinos</th>
                </tr>
              </thead>
              <tbody>
                {history.map(({ ym, summary: s }) => {
                  const rate = attendanceRate(s);
                  return (
                    <tr key={ym} className={`border-t border-zinc-200 dark:border-zinc-800 ${ym === month ? "font-semibold" : ""}`}>
                      <th scope="row" className="px-3 py-2 font-normal">
                        <Link href={`${basePath}?ver=mes&mes=${ym}`} className="underline-offset-4 hover:underline">
                          {formatMonth(ym)}
                        </Link>
                      </th>
                      <td className="px-3 py-2">
                        {hasTrainingDays && rate !== null ? `${rate}% (${s.attendedPlanned}/${s.plannedElapsed})` : "—"}
                      </td>
                      <td className="px-3 py-2">{hasTrainingDays ? s.missed : "—"}</td>
                      <td className="px-3 py-2">{s.completed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500">
            Presença = dias combinados com treino concluído ÷ dias combinados que já passaram. Os meses
            anteriores usam os dias combinados atuais.
          </p>
        </>
      )}
    </div>
  );
}
