import { createClient } from "@/lib/supabase/server";
import { buildAttendance, formatClock, localDate, trainingDaysText } from "@/lib/attendance";
import { currentWeekStart } from "@/lib/feedback";
import { formatDate } from "@/lib/assessment";
import { errorCls } from "@/lib/ui";
import AttendanceWeek from "@/components/attendance-week";

export const metadata = { title: "Histórico de treinos" };

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ concluido?: string }>;
}) {
  const { concluido } = await searchParams;
  const supabase = await createClient();

  const weekStart = currentWeekStart();
  // A RLS só devolve o cadastro e as sessões do próprio aluno.
  const [{ data: student }, { data: sessions, error }] = await Promise.all([
    supabase.from("students").select("training_days").maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, workout_name_snapshot, started_at, finished_at, status")
      .order("started_at", { ascending: false })
      .limit(30),
  ]);

  // buildAttendance já considera só os dias desta semana (as 30 últimas sessões cobrem a semana).
  const { days, summary } = buildAttendance(weekStart, sessions ?? [], student?.training_days ?? []);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Histórico de treinos</h1>

      {concluido === "1" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Check-out feito. Treino concluído, bom trabalho!
        </p>
      )}

      {error && <p className={errorCls}>Não foi possível carregar seus treinos: {error.message}</p>}

      {!error && (
        <div className="space-y-1">
          <h2 className="font-semibold">Esta semana</h2>
          <p className="text-xs text-zinc-500">Dias combinados: {trainingDaysText(student?.training_days ?? [])}</p>
          <AttendanceWeek days={days} summary={summary} />
        </div>
      )}

      {!error && sessions?.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhum treino realizado ainda.
        </p>
      )}

      {!error && (sessions?.length ?? 0) > 0 && <h2 className="font-semibold">Últimos treinos</h2>}
      <ul className="space-y-2">
        {sessions?.map((s) => (
          <li key={s.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="font-medium">{s.workout_name_snapshot}</p>
            <p className="text-sm text-zinc-500">
              {formatDate(localDate(s.started_at))} · check-in {formatClock(s.started_at)} · check-out{" "}
              {formatClock(s.finished_at)}
              {s.status !== "concluida" && " · não finalizado"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
