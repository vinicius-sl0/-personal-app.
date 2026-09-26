import Link from "next/link";
import {
  AlertCircle,
  CalendarCheck,
  ClipboardCheck,
  Dumbbell,
  MailWarning,
  MessageSquareText,
  MessagesSquare,
  Plus,
  Ruler,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate, todayIso } from "@/lib/assessment";
import { buildAttendance, formatClock, localDate } from "@/lib/attendance";
import { currentWeekStart, shortDate } from "@/lib/feedback";
import { unreadConversationIds } from "@/lib/chat-data";
import { formatMessageTime } from "@/lib/chat";
import { btnPrimaryCls, btnSecondaryCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, ErrorState } from "@/components/ui/states";
import ColumnChart from "@/components/charts/column-chart";

export const metadata = { title: "Dashboard" };

const DAYS = 28;

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function PersonalDashboard() {
  const profile = await requireRole("personal");
  const supabase = await createClient();
  const today = todayIso();
  const since = addDays(today, -(DAYS - 1));
  const weekStart = currentWeekStart();

  // Tudo já filtrado pela RLS (só os alunos deste Personal).
  const [studentsRes, sessionsRes, pendingRes, assessmentsRes, plansRes, unread] = await Promise.all([
    supabase.from("students").select("id, full_name, status, training_days, start_date").neq("status", "arquivado").order("full_name"),
    supabase
      .from("workout_sessions")
      .select("id, student_id, workout_name_snapshot, started_at, finished_at, status")
      .gte("started_at", `${since}T00:00:00-03:00`)
      .order("started_at", { ascending: false }),
    supabase
      .from("weekly_checkins")
      .select("id, student_id, week_start, submitted_at, pain_notes, students(full_name)", { count: "exact" })
      .is("replied_at", null)
      .order("submitted_at", { ascending: true })
      .limit(5),
    supabase.from("assessments").select("id, student_id, assessed_at, students(full_name)").order("assessed_at", { ascending: false }).limit(5),
    supabase.from("workout_plans").select("student_id").eq("status", "ativo").eq("is_template", false),
    unreadConversationIds(supabase, profile.id),
  ]);

  const error = studentsRes.error ?? sessionsRes.error;
  const students = studentsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const nameById = new Map(students.map((s) => [s.id, s.full_name]));

  const active = students.filter((s) => s.status === "ativo");
  const invited = students.filter((s) => s.status === "convidado");
  const withPlan = new Set((plansRes.data ?? []).map((p) => p.student_id));
  const withoutPlan = students.filter((s) => (s.status === "ativo" || s.status === "pausado") && !withPlan.has(s.id));
  const assessments30 = (assessmentsRes.data ?? []).filter((a) => a.assessed_at >= addDays(today, -29)).length;

  // Treinos concluídos por dia (últimos 28 dias)
  const perDay = new Map<string, number>();
  for (const s of sessions) if (s.status === "concluida") perDay.set(localDate(s.started_at), (perDay.get(localDate(s.started_at)) ?? 0) + 1);
  const chart = Array.from({ length: DAYS }, (_, i) => {
    const d = addDays(since, i);
    return { label: shortDate(d), title: formatDate(d), value: perDay.get(d) ?? 0 };
  });
  const weekDone = sessions.filter((s) => s.status === "concluida" && localDate(s.started_at) >= weekStart).length;

  // Situação da semana de cada aluno ativo (mesma regra da Frequência)
  const weekRows = [...active, ...students.filter((s) => s.status === "pausado")]
    .map((s) => {
      const { summary } = buildAttendance(
        weekStart,
        sessions.filter((x) => x.student_id === s.id),
        s.training_days,
        undefined,
        s.start_date,
      );
      return { s, summary };
    })
    .sort((a, b) => b.summary.missed - a.summary.missed || a.s.full_name.localeCompare(b.s.full_name));
  const withAbsences = weekRows.filter((r) => r.summary.missed > 0);

  const pendingCount = pendingRes.count ?? 0;
  const attention = pendingCount + withAbsences.length + withoutPlan.length + invited.length;
  const greetingHour = Number(new Date().toLocaleTimeString("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit" }));
  const greeting = greetingHour < 12 ? "Bom dia" : greetingHour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting}, ${profile.full_name.split(" ")[0]}`}
        description="Um resumo rápido de como estão seus alunos."
        actions={
          <>
            <Link href="/personal/alunos/novo" className={btnSecondaryCls}>
              <UserPlus aria-hidden className="size-4" /> Novo aluno
            </Link>
            <Link href="/personal/treinos/novo" className={`${btnPrimaryCls} !h-11 !w-auto px-5 text-sm`}>
              <Plus aria-hidden className="size-4" /> Criar treino
            </Link>
          </>
        }
      />

      {error && <ErrorState message={`Não foi possível carregar o resumo: ${error.message}`} />}

      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total de alunos" value={students.length} icon={<Users className="size-4" />} href="/personal/alunos" />
        <StatCard label="Alunos ativos" value={active.length} hint={invited.length ? `${invited.length} convite(s) pendente(s)` : undefined} icon={<Users className="size-4" />} />
        <StatCard label="Treinos na semana" value={weekDone} hint="Concluídos com check-out" icon={<Dumbbell className="size-4" />} href="/personal/frequencia" />
        <StatCard label="Avaliações (30 dias)" value={assessments30} icon={<Ruler className="size-4" />} href="/personal/avaliacoes" />
        <StatCard
          label="Feedbacks pendentes"
          value={pendingCount}
          icon={<MessageSquareText className="size-4" />}
          href="/personal/feedback"
          highlight={pendingCount > 0}
        />
        <StatCard
          label="Conversas não lidas"
          value={unread.size}
          icon={<MessagesSquare className="size-4" />}
          href="/personal/mensagens"
          highlight={unread.size > 0}
        />
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            icon={<CalendarCheck className="size-4" />}
            title="Treinos concluídos por dia"
            description={`Últimos ${DAYS} dias · todos os alunos`}
            action={<Badge tone="neutral">{chart.reduce((n, d) => n + d.value, 0)} no período</Badge>}
          />
          <ColumnChart data={chart} ariaLabel={`Treinos concluídos por dia nos últimos ${DAYS} dias`} unit="Treinos" />
        </Card>

        <Card>
          <CardHeader icon={<AlertCircle className="size-4" />} title="Precisa da sua atenção" description={attention ? `${attention} item(ns)` : "Tudo em dia"} />
          {attention === 0 ? (
            <p className="text-sm text-muted">Nenhuma pendência agora. 👏</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {pendingCount > 0 && (
                <li>
                  <Link href="/personal/feedback" className="flex items-center justify-between gap-2 rounded-xl bg-brand-soft px-3 py-2.5 hover:brightness-110">
                    <span className="flex items-center gap-2">
                      <MessageSquareText aria-hidden className="size-4 text-brand-ink" /> Feedbacks para responder
                    </span>
                    <Badge tone="brand">{pendingCount}</Badge>
                  </Link>
                </li>
              )}
              {withAbsences.length > 0 && (
                <li>
                  <Link href="/personal/frequencia" className="flex items-center justify-between gap-2 rounded-xl bg-subtle px-3 py-2.5 hover:bg-subtle-strong">
                    <span className="flex items-center gap-2">
                      <CalendarCheck aria-hidden className="size-4 text-red-600 dark:text-red-400" /> Alunos com falta na semana
                    </span>
                    <Badge tone="danger">{withAbsences.length}</Badge>
                  </Link>
                </li>
              )}
              {withoutPlan.length > 0 && (
                <li>
                  <Link href="/personal/treinos/novo" className="flex items-center justify-between gap-2 rounded-xl bg-subtle px-3 py-2.5 hover:bg-subtle-strong">
                    <span className="flex items-center gap-2">
                      <ClipboardCheck aria-hidden className="size-4 text-amber-600 dark:text-amber-400" /> Alunos sem ficha ativa
                    </span>
                    <Badge tone="warning">{withoutPlan.length}</Badge>
                  </Link>
                </li>
              )}
              {invited.length > 0 && (
                <li>
                  <Link href="/personal/alunos" className="flex items-center justify-between gap-2 rounded-xl bg-subtle px-3 py-2.5 hover:bg-subtle-strong">
                    <span className="flex items-center gap-2">
                      <MailWarning aria-hidden className="size-4 text-soft" /> Convites ainda não aceitos
                    </span>
                    <Badge tone="neutral">{invited.length}</Badge>
                  </Link>
                </li>
              )}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            icon={<Users className="size-4" />}
            title="Situação da semana"
            description="Presença nos dias combinados de cada aluno"
            action={
              <Link href="/personal/frequencia" className="text-sm font-medium text-brand-ink hover:underline">
                Ver frequência
              </Link>
            }
          />
          {weekRows.length === 0 ? (
            <EmptyState title="Nenhum aluno ativo ainda" description="Assim que um aluno ativar a conta, a semana dele aparece aqui." />
          ) : (
            <ul className="divide-y divide-line">
              {weekRows.slice(0, 8).map(({ s, summary }) => {
                const pct = summary.planned ? Math.round((summary.attendedPlanned / summary.planned) * 100) : 0;
                return (
                  <li key={s.id}>
                    <Link href={`/personal/alunos/${s.id}/frequencia`} className="flex items-center gap-3 py-3 hover:opacity-90">
                      <Avatar name={s.full_name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{s.full_name}</span>
                        {summary.planned > 0 ? (
                          <span className="mt-1.5 flex items-center gap-2">
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle-strong" aria-hidden>
                              <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted">
                              {summary.attendedPlanned}/{summary.planned} dias
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted">Dias combinados não definidos · {summary.completed} treino(s)</span>
                        )}
                      </span>
                      {summary.missed > 0 ? (
                        <Badge tone="danger">{summary.missed} falta{summary.missed > 1 ? "s" : ""}</Badge>
                      ) : summary.planned > 0 && summary.attendedPlanned === summary.planned ? (
                        <Badge tone="success">Em dia</Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader icon={<Dumbbell className="size-4" />} title="Treinos recentes" />
            {sessions.length === 0 ? (
              <p className="text-sm text-muted">Nenhum treino registrado nos últimos {DAYS} dias.</p>
            ) : (
              <ul className="space-y-3">
                {sessions.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{nameById.get(s.student_id) ?? "Aluno"}</span>
                      <span className="block truncate text-xs text-muted">
                        {s.workout_name_snapshot} · {formatMessageTime(s.started_at)}
                        {s.finished_at && ` → ${formatClock(s.finished_at)}`}
                      </span>
                    </span>
                    {s.status === "concluida" ? <Badge tone="success">Concluído</Badge> : <Badge tone="warning">Sem check-out</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader icon={<Ruler className="size-4" />} title="Avaliações recentes" />
            {(assessmentsRes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted">Nenhuma avaliação registrada ainda.</p>
            ) : (
              <ul className="space-y-2">
                {(assessmentsRes.data ?? []).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/personal/alunos/${a.student_id}/avaliacoes/${a.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-1 py-1 text-sm hover:bg-subtle"
                    >
                      <span className="truncate font-medium">{a.students?.full_name ?? "Aluno"}</span>
                      <span className="shrink-0 text-xs text-muted">{formatDate(a.assessed_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {(pendingRes.data ?? []).length > 0 && (
            <Card>
              <CardHeader icon={<MessageSquareText className="size-4" />} title="Feedbacks aguardando" />
              <ul className="space-y-2">
                {(pendingRes.data ?? []).map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/personal/alunos/${f.student_id}/feedback#${f.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-1 py-1 text-sm hover:bg-subtle"
                    >
                      <span className="truncate font-medium">{f.students?.full_name ?? "Aluno"}</span>
                      {f.pain_notes ? <Badge tone="danger">Relatou dor</Badge> : <span className="text-xs text-muted">{formatMessageTime(f.submitted_at)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
