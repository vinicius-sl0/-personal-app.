import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatMessageTime } from "@/lib/chat";
import { formatWeek } from "@/lib/feedback";
import { errorCls } from "@/lib/ui";

export const metadata = { title: "Feedback semanal" };

const rowCls =
  "flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900";

export default async function FeedbackPage() {
  await requireRole("personal");
  const supabase = await createClient();

  // A RLS devolve só os feedbacks dos alunos deste Personal.
  const [pending, answered] = await Promise.all([
    supabase
      .from("weekly_checkins")
      .select("id, student_id, week_start, submitted_at, pain_notes, students(full_name)")
      .is("replied_at", null)
      .order("submitted_at", { ascending: true }),
    supabase
      .from("weekly_checkins")
      .select("id, student_id, week_start, replied_at, students(full_name)")
      .not("replied_at", "is", null)
      .order("replied_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Feedback semanal</h1>

      <h2 className="font-semibold">Aguardando sua resposta</h2>
      {pending.error && <p className={errorCls}>Não foi possível carregar os feedbacks: {pending.error.message}</p>}
      {!pending.error && pending.data.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhum feedback esperando resposta.
        </p>
      )}
      <ul className="space-y-2">
        {pending.data?.map((c) => (
          <li key={c.id}>
            <Link href={`/personal/alunos/${c.student_id}/feedback#${c.id}`} className={rowCls}>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{c.students?.full_name ?? "Aluno"}</span>
                <span className="block text-sm text-zinc-500">
                  {formatWeek(c.week_start)} · enviado {formatMessageTime(c.submitted_at)}
                </span>
              </span>
              {c.pain_notes && (
                <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950/50 dark:text-red-200">
                  Relatou dor
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {!answered.error && answered.data.length > 0 && (
        <>
          <h2 className="font-semibold">Respondidos recentemente</h2>
          <ul className="space-y-2">
            {answered.data.map((c) => (
              <li key={c.id}>
                <Link href={`/personal/alunos/${c.student_id}/feedback#${c.id}`} className={rowCls}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.students?.full_name ?? "Aluno"}</span>
                    <span className="block text-sm text-zinc-500">{formatWeek(c.week_start)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {answered.error && <p className={errorCls}>Não foi possível carregar os respondidos: {answered.error.message}</p>}
    </section>
  );
}
