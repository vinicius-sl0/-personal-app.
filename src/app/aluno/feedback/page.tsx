import { createClient } from "@/lib/supabase/server";
import { FEEDBACK_COLUMNS, currentWeekStart, formatWeek } from "@/lib/feedback";
import { errorCls } from "@/lib/ui";
import FeedbackAnswers from "@/components/feedback-answers";
import CurrentFeedback from "./current-feedback";

export const metadata = { title: "Feedback semanal" };

export default async function FeedbackPage() {
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase.from("students").select("id, status").maybeSingle();
  if (!student) return <p className={errorCls}>Cadastro de aluno não encontrado.</p>;

  const weekStart = currentWeekStart();
  const { data: feedbacks, error } = await supabase
    .from("weekly_checkins")
    .select(FEEDBACK_COLUMNS)
    .eq("student_id", student.id)
    .order("week_start", { ascending: false })
    .limit(52);

  const current = feedbacks?.find((f) => f.week_start === weekStart) ?? null;
  const past = (feedbacks ?? []).filter((f) => f.week_start !== weekStart);
  const canAnswer = student.status === "ativo" || student.status === "pausado";

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Feedback semanal</h1>
        <p className="text-sm text-zinc-500">
          {formatWeek(weekStart)}. Leva 1 minuto e ajuda seu Personal a ajustar seu treino.
        </p>
      </div>

      {error && <p className={errorCls}>Não foi possível carregar seus feedbacks: {error.message}</p>}

      {!error && !canAnswer && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          O feedback fica disponível quando seu acesso estiver ativo.
        </p>
      )}

      {!error && canAnswer && (
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <CurrentFeedback feedback={current} />
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="font-semibold">Semanas anteriores</h2>
          <ul className="space-y-3">
            {past.map((f) => (
              <li key={f.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <FeedbackAnswers feedback={f} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
