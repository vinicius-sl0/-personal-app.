import { createClient } from "@/lib/supabase/server";
import { FEEDBACK_COLUMNS, currentWeekStart, formatWeek, shiftWeek } from "@/lib/feedback";
import { todayIso } from "@/lib/assessment";
import { hasPhotoConsent, loadPhotoSets } from "@/lib/photo-data";
import { errorCls } from "@/lib/ui";
import FeedbackAnswers from "@/components/feedback-answers";
import WeekPhotos, { groupSetsByWeek } from "@/components/week-photos";
import CurrentFeedback from "./current-feedback";
import WeeklyPhotos from "./weekly-photos";

export const metadata = { title: "Feedback semanal" };

const HISTORY_WEEKS = 52;

export default async function FeedbackPage() {
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase.from("students").select("id, status").maybeSingle();
  if (!student) return <p className={errorCls}>Cadastro de aluno não encontrado.</p>;

  const weekStart = currentWeekStart();
  const [{ data: feedbacks, error }, consent, photos] = await Promise.all([
    supabase
      .from("weekly_checkins")
      .select(FEEDBACK_COLUMNS)
      .eq("student_id", student.id)
      .order("week_start", { ascending: false })
      .limit(HISTORY_WEEKS),
    hasPhotoConsent(supabase, student.id),
    // Fotos das mesmas semanas do histórico (as mais antigas continuam na página Fotos).
    loadPhotoSets(supabase, student.id, { from: shiftWeek(weekStart, -(HISTORY_WEEKS - 1)) }),
  ]);
  const photosByWeek = groupSetsByWeek(photos.sets);

  const current = feedbacks?.find((f) => f.week_start === weekStart) ?? null;
  const past = (feedbacks ?? []).filter((f) => f.week_start !== weekStart);
  const canAnswer = student.status === "ativo" || student.status === "pausado";

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Feedback semanal</h1>
        <p className="text-sm text-muted">
          {formatWeek(weekStart)}. Leva 1 minuto e ajuda seu Personal a ajustar seu treino.
        </p>
      </div>

      {error && <p className={errorCls}>Não foi possível carregar seus feedbacks: {error.message}</p>}

      {!error && !canAnswer && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-soft dark:bg-zinc-900">
          O feedback fica disponível quando seu acesso estiver ativo.
        </p>
      )}

      {!error && canAnswer && (
        <>
          <div className="rounded-xl border border-line p-4 bg-card">
            <CurrentFeedback feedback={current} />
          </div>

          {photos.error && <p className={errorCls}>Não foi possível carregar suas fotos: {photos.error}</p>}
          {consent.error && (
            <p className={errorCls}>Não foi possível verificar a autorização de fotos: {consent.error.message}</p>
          )}
          {!consent.error && (
            <WeeklyPhotos
              studentId={student.id}
              today={todayIso()}
              weekStart={weekStart}
              consentActive={consent.active}
            >
              <WeekPhotos sets={photosByWeek.get(weekStart) ?? []} title="Enviadas nesta semana" />
            </WeeklyPhotos>
          )}
        </>
      )}

      {past.length > 0 && (
        <>
          <h2 className="font-semibold">Semanas anteriores</h2>
          <ul className="space-y-3">
            {past.map((f) => (
              <li key={f.id} className="space-y-3 rounded-xl border border-line p-4 bg-card">
                <FeedbackAnswers feedback={f} />
                <WeekPhotos sets={photosByWeek.get(f.week_start) ?? []} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
