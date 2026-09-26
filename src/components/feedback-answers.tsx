import { formatMessageTime } from "@/lib/chat";
import { LEGACY_SCALES, SCALES, formatWeek, type Feedback } from "@/lib/feedback";

// Nota de 1 a 5 com cor: verde = bom, âmbar = atenção, vermelho = ruim.
function toneCls(value: number, higherIsBetter: boolean) {
  const good = higherIsBetter ? value : 6 - value;
  if (good >= 4) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
  if (good === 3) return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
  return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
}

export default function FeedbackAnswers({
  feedback,
  showWeek = true,
  replyAuthor = "Personal",
}: {
  feedback: Feedback;
  showWeek?: boolean;
  replyAuthor?: string;
}) {
  // Perguntas antigas só aparecem se tiverem resposta (histórico).
  const scales = [...SCALES, ...LEGACY_SCALES.filter((s) => feedback[s.field] !== null)];
  const texts = [
    { label: "Dificuldades", value: feedback.difficulties, alert: false },
    { label: "Dores ou desconfortos", value: feedback.pain_notes, alert: true },
    { label: "Observações", value: feedback.comment, alert: false },
  ].filter((t) => t.value);

  return (
    <div className="space-y-3">
      {showWeek && (
        <div>
          <p className="font-medium">{formatWeek(feedback.week_start)}</p>
          <p className="text-xs text-muted">Enviado em {formatMessageTime(feedback.submitted_at)}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        {scales.map((s) => {
          const v = feedback[s.field];
          return (
            <div key={s.field} className="rounded-lg border border-line p-2">
              <dt className="text-xs text-muted">{s.label}</dt>
              <dd className="mt-1">
                {v ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneCls(v, s.higherIsBetter)}`}>
                    {v} · {s.levels[v - 1]}
                  </span>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {texts.map((t) => (
        <div key={t.label} className="text-sm">
          <p className={`text-xs ${t.alert ? "font-medium text-red-700 dark:text-red-400" : "text-muted"}`}>{t.label}</p>
          <p className="whitespace-pre-wrap">{t.value}</p>
        </div>
      ))}

      {feedback.personal_reply && (
        <div className="rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
          <p className="text-xs text-muted">
            Resposta do {replyAuthor}
            {feedback.replied_at && ` · ${formatMessageTime(feedback.replied_at)}`}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{feedback.personal_reply}</p>
        </div>
      )}
    </div>
  );
}
