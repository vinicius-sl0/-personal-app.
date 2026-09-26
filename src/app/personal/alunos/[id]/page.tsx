import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  Camera,
  Dumbbell,
  Mail,
  MessageSquareText,
  MessagesSquare,
  Phone,
  Plus,
  Ruler,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { btnPrimaryCls } from "@/lib/ui";
import { formatDate } from "@/lib/assessment";
import { buildAttendance, localDate, trainingDaysText } from "@/lib/attendance";
import { currentWeekStart } from "@/lib/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, ListLink } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState, ErrorState } from "@/components/ui/states";

export const metadata = { title: "Aluno" };

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  convidado: { label: "Convite pendente", tone: "warning" },
  ativo: { label: "Ativo", tone: "success" },
  pausado: { label: "Pausado", tone: "neutral" },
  arquivado: { label: "Arquivado", tone: "neutral" },
};
const PLAN_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  ativo: { label: "Ativa", tone: "success" },
  rascunho: { label: "Rascunho", tone: "warning" },
  encerrado: { label: "Encerrada", tone: "neutral" },
  arquivado: { label: "Arquivada", tone: "neutral" },
};

export default async function AlunoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("personal");
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, email, phone, status, goal, training_days, start_date")
    .eq("id", id)
    .maybeSingle();
  if (!student) notFound();

  const weekStart = currentWeekStart();
  const [{ data: plans, error }, { data: lastAssessment }, { data: sessions }, { data: feedback }] = await Promise.all([
    supabase.from("workout_plans").select("id, name, status, created_at, workouts(count)").eq("student_id", id).eq("is_template", false).order("created_at", { ascending: false }),
    supabase.from("assessments").select("assessed_at").eq("student_id", id).order("assessed_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("workout_sessions").select("id, workout_name_snapshot, started_at, finished_at, status").eq("student_id", id).order("started_at", { ascending: false }).limit(20),
    supabase.from("weekly_checkins").select("id, replied_at").eq("student_id", id).eq("week_start", weekStart).maybeSingle(),
  ]);

  const { summary } = buildAttendance(weekStart, sessions ?? [], student.training_days, undefined, student.start_date);
  const lastDone = (sessions ?? []).find((s) => s.status === "concluida");
  const st = STATUS[student.status];

  const sections = [
    { href: `/personal/alunos/${id}/avaliacoes`, icon: Ruler, title: "Avaliações e evolução", text: lastAssessment ? `Última em ${formatDate(lastAssessment.assessed_at)}` : "Nenhuma avaliação ainda" },
    { href: `/personal/alunos/${id}/frequencia`, icon: CalendarCheck, title: "Frequência", text: trainingDaysText(student.training_days) },
    { href: `/personal/treinos/volume?aluno=${id}`, icon: BarChart3, title: "Análise de volume", text: "Séries e carga por grupo muscular" },
    { href: `/personal/alunos/${id}/feedback`, icon: MessageSquareText, title: "Feedback semanal", text: feedback ? (feedback.replied_at ? "Semana respondida" : "Aguardando sua resposta") : "Desta semana ainda não enviado" },
    { href: `/personal/alunos/${id}/fotos`, icon: Camera, title: "Fotos de evolução", text: "Antes e depois, por data e ângulo" },
    { href: `/personal/alunos/${id}/mensagens`, icon: MessagesSquare, title: "Mensagens", text: `Conversa com ${student.full_name.split(" ")[0]}` },
  ];

  return (
    <>
      <PageHeader back={{ href: "/personal/alunos", label: "Alunos" }} />
      <div className="-mt-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={student.full_name} size="lg" ring={student.status === "ativo"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{student.full_name}</h1>
            <Badge tone={st.tone} dot>
              {st.label}
            </Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Mail aria-hidden className="size-3.5" /> {student.email}
            </span>
            {student.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone aria-hidden className="size-3.5" /> {student.phone}
              </span>
            )}
            {student.goal && (
              <span className="inline-flex items-center gap-1.5">
                <Target aria-hidden className="size-3.5" /> {student.goal}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Semana" value={summary.planned ? `${summary.attendedPlanned}/${summary.planned}` : summary.completed} hint={summary.planned ? "dias combinados" : "treinos concluídos"} highlight={summary.missed > 0} />
        <StatCard label="Último treino" value={lastDone ? formatDate(localDate(lastDone.started_at)).slice(0, 5) : "—"} hint={lastDone?.workout_name_snapshot ?? "Nenhum ainda"} />
        <StatCard label="Última avaliação" value={lastAssessment ? formatDate(lastAssessment.assessed_at).slice(0, 5) : "—"} hint={lastAssessment ? formatDate(lastAssessment.assessed_at) : "Nenhuma ainda"} />
        <StatCard label="Faltas na semana" value={summary.missed} hint={summary.planned ? "nos dias combinados" : "dias não definidos"} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader
            icon={<Dumbbell className="size-4" />}
            title="Fichas de treino"
            action={
              <Link href={`/personal/alunos/${id}/treinos/novo`} className={`${btnPrimaryCls} !h-10 !w-auto px-4 text-sm`}>
                <Plus aria-hidden className="size-4" /> Nova ficha
              </Link>
            }
          />
          {error && <ErrorState message={`Não foi possível carregar as fichas: ${error.message}`} />}
          {!error && plans?.length === 0 && (
            <EmptyState title="Nenhuma ficha ainda" description="Clique em “Nova ficha” para montar a primeira." />
          )}
          <ul className="space-y-2">
            {plans?.map((p) => {
              const s = PLAN_STATUS[p.status] ?? PLAN_STATUS.encerrado;
              const n = p.workouts?.[0]?.count ?? 0;
              return (
                <li key={p.id}>
                  <ListLink href={`/personal/alunos/${id}/treinos/${p.id}`} aside={<Badge tone={s.tone} dot>{s.label}</Badge>}>
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="text-xs text-muted">
                      {n} {n === 1 ? "treino" : "treinos"} · criada em {formatDate(p.created_at.slice(0, 10))}
                    </span>
                  </ListLink>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {sections.map(({ href, icon: Icon, title, text }) => (
            <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-line bg-card p-4 transition hover:border-line-strong hover:bg-subtle">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{title}</span>
                <span className="block truncate text-sm text-muted">{text}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
