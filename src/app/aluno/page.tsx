import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  MessageSquareText,
  MessagesSquare,
  Play,
  Ruler,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { isMinor } from "@/lib/utils";
import { formatDate, formatValue, todayIso } from "@/lib/assessment";
import { loadSeries } from "@/lib/assessment-data";
import { buildAttendance, formatClock, localDate, STATUS_INFO, WEEKDAYS } from "@/lib/attendance";
import { currentWeekStart } from "@/lib/feedback";
import { unreadConversationIds } from "@/lib/chat-data";
import { formatMessageTime } from "@/lib/chat";
import { btnPrimaryCls, btnSecondaryCls, cardCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sparkline from "@/components/charts/sparkline";
import TermsForm from "./terms-form";

export const metadata = { title: "Início" };

const DAY_CLS: Record<string, string> = {
  concluido: "bg-emerald-600 text-white",
  treinando: "bg-sky-600 text-white",
  sem_checkout: "bg-amber-400 text-black",
  faltou: "bg-red-600 text-white",
  hoje: "border-2 border-brand text-ink",
  previsto: "border border-dashed border-field text-soft",
  folga: "bg-subtle text-muted",
};
const DAY_ICON: Record<string, string> = { concluido: "✓", treinando: "•", sem_checkout: "!", faltou: "✕" };

export default async function AlunoHome() {
  const profile = await requireRole("aluno");
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase
    .from("students")
    .select("id, status, birth_date, training_days, start_date")
    .maybeSingle();

  if (student?.status === "convidado") {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader eyebrow="Bem-vindo" title="Falta pouco" description="Para liberar seu acesso, aceite os consentimentos abaixo." />
        <Card>
          <TermsForm minor={isMinor(student.birth_date)} />
        </Card>
      </div>
    );
  }
  if (!student) return <p className="text-sm text-muted">Cadastro de aluno não encontrado.</p>;

  const today = todayIso();
  const weekStart = currentWeekStart();

  const [planRes, sessionsRes, feedbackRes, convRes, lastAssessRes, seriesRes, unread] = await Promise.all([
    // A RLS só devolve a ficha ATIVA do aluno.
    supabase.from("workout_plans").select("id, name, workouts(id, name, position, workout_exercises(count))").eq("status", "ativo").maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, workout_id, workout_name_snapshot, started_at, finished_at, status")
      .order("started_at", { ascending: false })
      .limit(20),
    supabase.from("weekly_checkins").select("id, submitted_at, personal_reply, replied_at").eq("student_id", student.id).eq("week_start", weekStart).maybeSingle(),
    supabase.from("conversations").select("id, personal_id").maybeSingle(),
    supabase.from("assessments").select("id, assessed_at").order("assessed_at", { ascending: false }).limit(1).maybeSingle(),
    loadSeries(supabase, student.id),
    unreadConversationIds(supabase, profile.id),
  ]);

  const plan = planRes.data;
  const workouts = (plan?.workouts ?? []).slice().sort((a, b) => a.position - b.position);
  const sessions = sessionsRes.data ?? [];

  // Treino de hoje / próximo treino (sequência A → B → C...)
  const todays = sessions.filter((s) => localDate(s.started_at) === today);
  const inProgress = todays.find((s) => s.status === "em_andamento");
  const doneToday = todays.find((s) => s.status === "concluida");
  const lastDone = sessions.find((s) => s.status === "concluida" && workouts.some((w) => w.id === s.workout_id));
  const lastIdx = lastDone ? workouts.findIndex((w) => w.id === lastDone.workout_id) : -1;
  const next = workouts.length ? workouts[(lastIdx + 1) % workouts.length] : null;
  const nextCount = next?.workout_exercises?.[0]?.count ?? 0;

  const { days, summary } = buildAttendance(weekStart, sessions, student.training_days, undefined, student.start_date);
  const isTrainingDay = student.training_days.includes(WEEKDAYS[(new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7].value);

  // Avaliação: peso, % gordura e massa muscular (última e variação desde a anterior)
  const series = seriesRes.series;
  const pick = (...keys: string[]) => keys.map((k) => series.find((s) => s.metric.key === k)).find(Boolean);
  const highlights = [pick("weight_kg"), pick("body_fat_pct"), pick("muscle_mass_kg", "lean_mass_kg")].filter(
    (s): s is NonNullable<typeof s> => !!s,
  );
  const weight = pick("weight_kg");

  // Mensagens recentes
  const conv = convRes.data;
  const { data: messages } = conv
    ? await supabase
        .from("messages")
        .select("id, sender_id, body, created_at, deleted_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(3)
    : { data: [] as { id: string; sender_id: string | null; body: string | null; created_at: string; deleted_at: string | null }[] };
  const hasUnread = conv ? unread.has(conv.id) : false;

  const hour = Number(new Date().toLocaleTimeString("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit" }));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dateLabel = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" });
  const feedback = feedbackRes.data;

  return (
    <>
      <PageHeader eyebrow={dateLabel} title={`${greeting}, ${profile.full_name.split(" ")[0]}!`} />

      {/* TREINO DE HOJE */}
      <section
        aria-label="Treino de hoje"
        className="theme-dark relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8"
      >
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink">
              {inProgress ? "Treinando agora" : doneToday ? "Treino de hoje" : "Próximo treino"}
            </p>
            {!plan || !next ? (
              <>
                <p className="mt-2 text-2xl font-bold">Sua ficha ainda não está pronta</p>
                <p className="mt-1 text-sm text-soft">Seu Personal vai publicar seu treino em breve.</p>
              </>
            ) : inProgress ? (
              <>
                <p className="mt-2 text-3xl font-bold">{inProgress.workout_name_snapshot}</p>
                <p className="mt-1 text-sm text-soft">Check-in às {formatClock(inProgress.started_at)} · não esqueça do check-out no fim</p>
              </>
            ) : doneToday ? (
              <>
                <p className="mt-2 flex items-center gap-2 text-3xl font-bold">
                  <CheckCircle2 aria-hidden className="size-7 animate-pop text-emerald-400" /> Concluído!
                </p>
                <p className="mt-1 text-sm text-soft">
                  {doneToday.workout_name_snapshot} · {formatClock(doneToday.started_at)} → {formatClock(doneToday.finished_at)}. Próximo:{" "}
                  <strong className="text-ink">{next.name}</strong>
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-3xl font-bold">{next.name}</p>
                <p className="mt-1 text-sm text-soft">
                  {nextCount} {nextCount === 1 ? "exercício" : "exercícios"} · {plan.name}
                  {student.training_days.length > 0 && (isTrainingDay ? " · hoje é dia de treino" : " · hoje é dia de descanso")}
                </p>
              </>
            )}
          </div>
          {plan && next && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {inProgress?.workout_id ? (
                <Link href={`/aluno/treinos/${inProgress.workout_id}/executar`} className={`${btnPrimaryCls} sm:!w-auto sm:px-6`}>
                  <Play aria-hidden className="size-4" /> Continuar treino
                </Link>
              ) : !doneToday ? (
                <Link href={`/aluno/treinos/${next.id}/executar`} className={`${btnPrimaryCls} sm:!w-auto sm:px-6`}>
                  <Play aria-hidden className="size-4" /> Fazer check-in
                </Link>
              ) : null}
              <Link href="/aluno/treinos" className={btnSecondaryCls}>
                Ver ficha
              </Link>
            </div>
          )}
        </div>
      </section>

      {!feedback && student.status === "ativo" && (
        <Link
          href="/aluno/feedback"
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-brand/40 bg-brand-soft px-4 py-3 text-sm transition hover:brightness-110"
        >
          <span>
            <strong>Feedback da semana pendente.</strong> Conte como foi sua semana para o seu Personal.
          </span>
          <ArrowRight aria-hidden className="size-4 shrink-0 text-brand-ink" />
        </Link>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* SUA SEMANA */}
        <Card>
          <CardHeader
            icon={<CalendarCheck className="size-4" />}
            title="Sua semana"
            description={summary.planned ? `${summary.attendedPlanned} de ${summary.planned} dias combinados` : `${summary.completed} treino(s) concluído(s)`}
          />
          <ol className="grid grid-cols-7 gap-1.5">
            {days.map((d) => (
              <li key={d.date} className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-muted">{d.weekday.short}</span>
                <span
                  title={STATUS_INFO[d.status].label}
                  aria-label={`${d.weekday.long}: ${STATUS_INFO[d.status].label}`}
                  className={`grid size-9 place-items-center rounded-full text-xs font-bold ${DAY_CLS[d.status]}`}
                >
                  {DAY_ICON[d.status] ?? Number(d.date.slice(8))}
                </span>
              </li>
            ))}
          </ol>
          <Link href="/aluno/treinos/historico" className="mt-4 inline-block text-sm font-medium text-brand-ink hover:underline">
            Ver frequência completa
          </Link>
        </Card>

        {/* ÚLTIMA AVALIAÇÃO */}
        <Card>
          <CardHeader
            icon={<Ruler className="size-4" />}
            title="Última avaliação"
            description={lastAssessRes.data ? formatDate(lastAssessRes.data.assessed_at) : "Nenhuma avaliação ainda"}
          />
          {highlights.length === 0 ? (
            <p className="text-sm text-muted">Quando seu Personal registrar a primeira avaliação, os números aparecem aqui.</p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-2">
                {highlights.map((s) => {
                  const last = s.points[s.points.length - 1];
                  const prev = s.points[s.points.length - 2];
                  const delta = prev ? last.value - prev.value : null;
                  return (
                    <div key={s.metric.id} className="rounded-xl bg-subtle p-2.5">
                      <dt className="truncate text-[11px] text-muted">{s.metric.label}</dt>
                      <dd className="text-base font-bold tabular-nums">{formatValue(last.value, s.metric)}</dd>
                      {delta !== null && delta !== 0 && (
                        <dd className="text-[11px] tabular-nums text-soft">
                          {delta > 0 ? "▲ +" : "▼ "}
                          {formatValue(Math.abs(delta), s.metric)}
                        </dd>
                      )}
                    </div>
                  );
                })}
              </dl>
              {weight && weight.points.length >= 2 && (
                <div className="mt-3">
                  <p className="text-[11px] text-muted">Peso nas avaliações</p>
                  <Sparkline
                    points={weight.points.map((p) => ({ label: formatDate(p.date), value: p.value }))}
                    ariaLabel="Evolução do peso nas avaliações"
                    format={(v) => formatValue(v, weight.metric)}
                  />
                </div>
              )}
            </>
          )}
          <Link href="/aluno/avaliacoes" className="mt-3 inline-block text-sm font-medium text-brand-ink hover:underline">
            Ver evolução
          </Link>
        </Card>

        {/* FEEDBACK SEMANAL */}
        <Card>
          <CardHeader icon={<MessageSquareText className="size-4" />} title="Feedback semanal" />
          {!feedback ? (
            <>
              <Badge tone="warning">Não enviado</Badge>
              <p className="mt-3 text-sm text-muted">Leva 1 minuto e ajuda seu Personal a ajustar seu treino.</p>
              <Link href="/aluno/feedback" className={`${btnSecondaryCls} mt-4 w-full`}>
                Responder agora
              </Link>
            </>
          ) : feedback.replied_at ? (
            <>
              <Badge tone="success">Respondido pelo Personal</Badge>
              {feedback.personal_reply && (
                <p className="mt-3 line-clamp-3 rounded-xl bg-subtle p-3 text-sm italic text-soft">“{feedback.personal_reply}”</p>
              )}
              <Link href="/aluno/feedback" className="mt-3 inline-block text-sm font-medium text-brand-ink hover:underline">
                Ver resposta
              </Link>
            </>
          ) : (
            <>
              <Badge tone="info">Enviado · aguardando resposta</Badge>
              <p className="mt-3 text-sm text-muted">Enviado {formatMessageTime(feedback.submitted_at)}.</p>
              <Link href="/aluno/feedback" className="mt-3 inline-block text-sm font-medium text-brand-ink hover:underline">
                Ver meu feedback
              </Link>
            </>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* MENSAGENS */}
        <Card>
          <CardHeader
            icon={<MessagesSquare className="size-4" />}
            title="Mensagens"
            action={hasUnread ? <Badge tone="brand" dot>Nova</Badge> : undefined}
          />
          {(messages ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nenhuma mensagem ainda. Mande um oi para o seu Personal!</p>
          ) : (
            <ul className="space-y-2">
              {(messages ?? []).map((m) => {
                const mine = m.sender_id === profile.id;
                return (
                  <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <span
                      className={`max-w-[85%] truncate rounded-2xl px-3 py-2 text-sm ${
                        mine ? "rounded-br-sm bg-brand text-brand-contrast" : "rounded-bl-sm bg-subtle-strong text-ink"
                      }`}
                    >
                      {m.deleted_at ? <em className="opacity-70">Mensagem apagada</em> : m.body}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/aluno/mensagens" className={`${btnSecondaryCls} mt-4 w-full`}>
            Abrir conversa
          </Link>
        </Card>

        {/* FICHA ATUAL */}
        <Card>
          <CardHeader icon={<Dumbbell className="size-4" />} title="Minha ficha" description={plan?.name ?? "Nenhuma ficha ativa"} />
          {workouts.length === 0 ? (
            <p className="text-sm text-muted">Assim que seu Personal publicar a ficha, seus treinos aparecem aqui.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {workouts.map((w) => {
                const n = w.workout_exercises?.[0]?.count ?? 0;
                const isNext = !doneToday && !inProgress && w.id === next?.id;
                return (
                  <li key={w.id}>
                    <Link
                      href={`/aluno/treinos/${w.id}`}
                      className={`${cardCls} flex items-center justify-between gap-2 p-3 transition hover:border-line-strong ${isNext ? "border-brand/50" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{w.name}</span>
                        <span className="text-xs text-muted">
                          {n} {n === 1 ? "exercício" : "exercícios"}
                        </span>
                      </span>
                      {isNext && <Badge tone="brand">Próximo</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
