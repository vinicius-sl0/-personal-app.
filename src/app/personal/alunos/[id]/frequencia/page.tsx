import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { buildAttendance, weekRange } from "@/lib/attendance";
import { currentWeekStart, formatWeek, shiftWeek, weekStartOf } from "@/lib/feedback";
import { errorCls } from "@/lib/ui";
import AttendanceWeek from "@/components/attendance-week";
import TrainingDaysEditor from "./training-days-editor";

export const metadata = { title: "Frequência" };

export default async function FrequenciaAlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ semana?: string }>;
}) {
  await requireRole("personal");
  const { id } = await params;
  const { semana } = await searchParams;

  const thisWeek = currentWeekStart();
  const requested = semana && /^\d{4}-\d{2}-\d{2}$/.test(semana) ? weekStartOf(semana) : thisWeek;
  const weekStart = requested > thisWeek ? thisWeek : requested;

  const supabase = await createClient();
  const range = weekRange(weekStart);
  const [{ data: student }, { data: sessions, error }] = await Promise.all([
    supabase.from("students").select("id, full_name, training_days").eq("id", id).maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, workout_name_snapshot, started_at, finished_at, status")
      .eq("student_id", id)
      .gte("started_at", range.from)
      .lte("started_at", range.to),
  ]);
  if (!student) notFound();

  const { days, summary } = buildAttendance(weekStart, sessions ?? [], student.training_days);
  const base = `/personal/alunos/${id}/frequencia`;

  return (
    <section className="space-y-4">
      <div>
        <Link href={`/personal/alunos/${id}`} className="text-sm text-zinc-500 underline">
          ← Voltar para {student.full_name}
        </Link>
        <h1 className="mt-2 text-xl font-bold">Frequência (check-in / check-out)</h1>
      </div>

      <TrainingDaysEditor studentId={id} initial={student.training_days} />

      <div className="flex items-center justify-between gap-2">
        <Link href={`${base}?semana=${shiftWeek(weekStart, -1)}`} className="text-sm underline">
          ← Anterior
        </Link>
        <p className="text-center text-sm font-medium">
          {weekStart === thisWeek ? "Esta semana" : formatWeek(weekStart)}
        </p>
        {weekStart < thisWeek ? (
          <Link href={`${base}?semana=${shiftWeek(weekStart, 1)}`} className="text-sm underline">
            Próxima →
          </Link>
        ) : (
          <span className="w-16" />
        )}
      </div>

      {error ? (
        <p className={errorCls}>Não foi possível carregar os treinos: {error.message}</p>
      ) : (
        <AttendanceWeek days={days} summary={summary} />
      )}
    </section>
  );
}
