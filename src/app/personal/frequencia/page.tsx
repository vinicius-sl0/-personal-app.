import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { buildAttendance, summaryText, trainingDaysText, weekRange } from "@/lib/attendance";
import { currentWeekStart, formatWeek } from "@/lib/feedback";
import { errorCls } from "@/lib/ui";

export const metadata = { title: "Frequência" };

export default async function FrequenciaPage() {
  await requireRole("personal");
  const supabase = await createClient();

  const weekStart = currentWeekStart();
  const range = weekRange(weekStart);
  // A RLS devolve só os alunos (e sessões) deste Personal.
  const [{ data: students, error }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, training_days")
      .in("status", ["ativo", "pausado"])
      .order("full_name"),
    supabase
      .from("workout_sessions")
      .select("id, student_id, workout_name_snapshot, started_at, finished_at, status")
      .gte("started_at", range.from)
      .lte("started_at", range.to),
  ]);

  const rows = (students ?? []).map((s) => {
    const { days, summary } = buildAttendance(
      weekStart,
      (sessions ?? []).filter((x) => x.student_id === s.id),
      s.training_days,
    );
    return { student: s, summary, missed: days.filter((d) => d.status === "faltou").length };
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Frequência</h1>
        <p className="text-sm text-zinc-500">{formatWeek(weekStart)}</p>
      </div>

      {(error || sessionsError) && (
        <p className={errorCls}>Não foi possível carregar a frequência: {(error ?? sessionsError)?.message}</p>
      )}

      {!error && rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhum aluno ativo ainda.
        </p>
      )}

      <ul className="space-y-2">
        {rows.map(({ student, summary, missed }) => (
          <li key={student.id}>
            <Link
              href={`/personal/alunos/${student.id}/frequencia`}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{student.full_name}</span>
                <span className="block text-sm text-zinc-500">{summaryText(summary)}</span>
                <span className="block text-xs text-zinc-400">{trainingDaysText(student.training_days)}</span>
              </span>
              {missed > 0 && (
                <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950/50 dark:text-red-200">
                  {missed} {missed === 1 ? "falta" : "faltas"}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
