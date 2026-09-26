import Link from "next/link";
import { AlertTriangle, CheckCircle2, Hourglass, MessageSquareText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatMessageTime } from "@/lib/chat";
import { currentWeekStart, formatWeek, SCALES, shiftWeek, weekStartOf } from "@/lib/feedback";
import { cardCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, ListLink } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, ErrorState } from "@/components/ui/states";

export const metadata = { title: "Feedback semanal" };

const WINDOW_WEEKS = 4;
const nf1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

// Tom do indicador pela média (1–5): verde bom, âmbar atenção, vermelho ruim. Sempre com número.
const tone = (v: number) => (v >= 3.5 ? "bg-emerald-500" : v >= 2.5 ? "bg-amber-400" : "bg-red-500");

export default async function FeedbackPage() {
  await requireRole("personal");
  const supabase = await createClient();
  const since = shiftWeek(currentWeekStart(), -(WINDOW_WEEKS - 1));

  // A RLS devolve só os feedbacks dos alunos deste Personal.
  const [pending, answered, recent] = await Promise.all([
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
      .limit(10),
    supabase
      .from("weekly_checkins")
      .select("id, student_id, week_start, training_feeling, energy, diet_adherence, progress_feeling, pain_notes, students(full_name)")
      .gte("week_start", since),
  ]);

  // Semanas (aluno + segunda-feira) em que há fotos. A RLS só devolve fotos com autorização ativa.
  const oldestWeek = pending.data?.map((c) => c.week_start).sort()[0];
  const withPhotos = new Set<string>();
  if (oldestWeek) {
    const { data: sets } = await supabase.from("progress_photo_sets").select("student_id, taken_at").gte("taken_at", oldestWeek);
    for (const p of sets ?? []) withPhotos.add(`${p.student_id}:${weekStartOf(p.taken_at)}`);
  }

  // Indicadores das últimas semanas: média de cada pergunta (1–5) e quem pediu atenção.
  const rows = recent.data ?? [];
  const averages = SCALES.map((s) => {
    const vals = rows.map((r) => r[s.field]).filter((v): v is number => typeof v === "number");
    return { ...s, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, n: vals.length };
  });
  const attention = new Map<string, { id: string; name: string; reasons: Set<string> }>();
  for (const r of rows) {
    const reasons: string[] = [];
    if (r.pain_notes) reasons.push("Relatou dor");
    for (const s of SCALES) {
      const v = r[s.field];
      if (typeof v === "number" && v <= 2) reasons.push(`${s.label.replace(/\?$/, "")}: ${v}`);
    }
    if (!reasons.length) continue;
    const a = attention.get(r.student_id) ?? { id: r.student_id, name: r.students?.full_name ?? "Aluno", reasons: new Set<string>() };
    reasons.forEach((x) => a.reasons.add(x));
    attention.set(r.student_id, a);
  }
  const painCount = new Set(rows.filter((r) => r.pain_notes).map((r) => r.student_id)).size;
  const pendingCount = pending.data?.length ?? 0;

  return (
    <>
      <PageHeader eyebrow="Feedback semanal" title="Como estão seus alunos" description="Respostas do questionário semanal, com resumo das últimas semanas." />

      {(pending.error || recent.error) && <ErrorState message={`Não foi possível carregar os feedbacks: ${(pending.error ?? recent.error)!.message}`} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Aguardando resposta" value={pendingCount} icon={<Hourglass className="size-4" />} highlight={pendingCount > 0} />
        <StatCard label={`Recebidos (${WINDOW_WEEKS} semanas)`} value={rows.length} icon={<MessageSquareText className="size-4" />} />
        <StatCard label="Respondidos recentemente" value={answered.data?.length ?? 0} hint="últimos 10" icon={<CheckCircle2 className="size-4" />} />
        <StatCard label="Alunos com dor" value={painCount} hint={`nas últimas ${WINDOW_WEEKS} semanas`} icon={<AlertTriangle className="size-4" />} highlight={painCount > 0} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Média das respostas" description={`Últimas ${WINDOW_WEEKS} semanas · escala de 1 a 5`} />
          {rows.length === 0 ? (
            <p className="text-sm text-muted">Nenhum feedback recebido nesse período.</p>
          ) : (
            <ul className="space-y-4">
              {averages.map((a) => (
                <li key={a.field}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-soft">{a.label}</span>
                    <span className="font-semibold tabular-nums">{a.avg === null ? "—" : nf1.format(a.avg)}</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-subtle-strong"
                    role="meter"
                    aria-label={a.label}
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-valuenow={a.avg ?? undefined}
                  >
                    {a.avg !== null && <div className={`h-full rounded-full ${tone(a.avg)}`} style={{ width: `${((a.avg - 1) / 4) * 100}%` }} />}
                  </div>
                  <p className="mt-1 text-[11px] text-muted">{a.n} resposta(s)</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader icon={<AlertTriangle className="size-4" />} title="Pedem atenção" description="Dor relatada ou nota 1–2 em alguma pergunta" />
          {attention.size === 0 ? (
            <p className="text-sm text-muted">Ninguém com sinal de alerta nas últimas semanas. 👏</p>
          ) : (
            <ul className="space-y-2">
              {[...attention.values()].map((a) => (
                <li key={a.id}>
                  <Link href={`/personal/alunos/${a.id}/feedback`} className="flex items-start gap-3 rounded-xl p-2 hover:bg-subtle">
                    <Avatar name={a.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block font-medium">{a.name}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {[...a.reasons].slice(0, 4).map((r) => (
                          <Badge key={r} tone={r === "Relatou dor" ? "danger" : "warning"}>
                            {r}
                          </Badge>
                        ))}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Aguardando sua resposta</h2>
      {!pending.error && pendingCount === 0 && <EmptyState title="Tudo respondido" description="Nenhum feedback esperando resposta." />}
      <ul className="grid gap-2 md:grid-cols-2">
        {pending.data?.map((c) => (
          <li key={c.id}>
            <ListLink
              href={`/personal/alunos/${c.student_id}/feedback#${c.id}`}
              aside={
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {c.pain_notes && <Badge tone="danger">Relatou dor</Badge>}
                  {withPhotos.has(`${c.student_id}:${c.week_start}`) && <Badge tone="info">📷 Fotos</Badge>}
                </span>
              }
            >
              <span className="block truncate font-semibold">{c.students?.full_name ?? "Aluno"}</span>
              <span className="block text-sm text-muted">
                {formatWeek(c.week_start)} · enviado {formatMessageTime(c.submitted_at)}
              </span>
            </ListLink>
          </li>
        ))}
      </ul>

      {!answered.error && (answered.data?.length ?? 0) > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold">Respondidos recentemente</h2>
          <ul className={`${cardCls} divide-y divide-line`}>
            {answered.data!.map((c) => (
              <li key={c.id}>
                <Link href={`/personal/alunos/${c.student_id}/feedback#${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-subtle">
                  <span className="truncate font-medium">{c.students?.full_name ?? "Aluno"}</span>
                  <span className="shrink-0 text-sm text-muted">{formatWeek(c.week_start)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {answered.error && <ErrorState message={`Não foi possível carregar os respondidos: ${answered.error.message}`} />}
    </>
  );
}
