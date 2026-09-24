import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { FEEDBACK_COLUMNS, currentWeekStart } from "@/lib/feedback";
import { errorCls } from "@/lib/ui";
import FeedbackAnswers from "@/components/feedback-answers";
import FeedbackReplyForm from "@/components/feedback-reply-form";

export const metadata = { title: "Feedback do aluno" };

export default async function FeedbackAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("personal");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: feedbacks, error }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("id", id).maybeSingle(),
    supabase
      .from("weekly_checkins")
      .select(FEEDBACK_COLUMNS)
      .eq("student_id", id)
      .order("week_start", { ascending: false })
      .limit(52),
  ]);
  if (!student) notFound();

  const sentThisWeek = feedbacks?.some((c) => c.week_start === currentWeekStart());

  return (
    <section className="space-y-4">
      <div>
        <Link href={`/personal/alunos/${id}`} className="text-sm text-zinc-500 underline">
          ← Voltar para {student.full_name}
        </Link>
        <h1 className="mt-2 text-xl font-bold">Feedback semanal</h1>
        {!error && !sentThisWeek && (
          <p className="text-sm text-zinc-500">O feedback desta semana ainda não foi enviado.</p>
        )}
      </div>

      {error && <p className={errorCls}>Não foi possível carregar os feedbacks: {error.message}</p>}

      {!error && feedbacks.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {student.full_name} ainda não enviou nenhum feedback.
        </p>
      )}

      <ul className="space-y-3">
        {feedbacks?.map((c) => (
          <li
            key={c.id}
            id={c.id}
            className={`scroll-mt-4 space-y-3 rounded-xl border p-4 ${
              c.replied_at ? "border-zinc-200 dark:border-zinc-800" : "border-amber-300 dark:border-amber-800"
            }`}
          >
            <FeedbackAnswers feedback={c} replyAuthor="Personal (você)" />
            <FeedbackReplyForm id={c.id} currentReply={c.personal_reply} />
          </li>
        ))}
      </ul>
    </section>
  );
}
