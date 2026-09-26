import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatMessageTime } from "@/lib/chat";
import { formatWeek, weekStartOf } from "@/lib/feedback";
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

  // Semanas (aluno + segunda-feira) em que há fotos. A RLS só devolve fotos com autorização ativa.
  const oldestWeek = pending.data?.map((c) => c.week_start).sort()[0];
  const withPhotos = new Set<string>();
  if (oldestWeek) {
    const { data: sets } = await supabase
      .from("progress_photo_sets")
      .select("student_id, taken_at")
      .gte("taken_at", oldestWeek);
    for (const p of sets ?? []) withPhotos.add(`${p.student_id}:${weekStartOf(p.taken_at)}`);
  }

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
              <span className="flex shrink-0 flex-col items-end gap-1">
                {c.pain_notes && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950/50 dark:text-red-200">
                    Relatou dor
                  </span>
                )}
                {withPhotos.has(`${c.student_id}:${c.week_start}`) && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
                    📷 Fotos
                  </span>
                )}
              </span>
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
