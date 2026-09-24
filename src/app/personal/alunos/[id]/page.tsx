import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { btnPrimaryCls, btnSecondaryCls, errorCls } from "@/lib/ui";
import { PLAN_STATUS_LABEL } from "@/lib/workout-labels";
import { formatDate } from "@/lib/assessment";
import { trainingDaysText } from "@/lib/attendance";

export const metadata = { title: "Aluno" };

const STATUS = {
  convidado: { label: "Convite pendente", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200" },
  ativo: { label: "Ativo", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" },
  pausado: { label: "Pausado", cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  arquivado: { label: "Arquivado", cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
} as const;

export default async function AlunoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("personal");
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, email, phone, status, goal, training_days")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const [{ data: plans, error }, { data: lastAssessment }] = await Promise.all([
    supabase
      .from("workout_plans")
      .select("id, name, status, created_at")
      .eq("student_id", id)
      .eq("is_template", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("assessments")
      .select("assessed_at")
      .eq("student_id", id)
      .order("assessed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <section className="space-y-4">
      <div>
        <Link href="/personal/alunos" className="text-sm text-zinc-500 underline">
          ← Voltar para Alunos
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">{student.full_name}</h1>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS[student.status].cls}`}>
            {STATUS[student.status].label}
          </span>
        </div>
        <p className="text-sm text-zinc-500">{student.email}</p>
        {student.goal && <p className="mt-1 text-sm">Objetivo: {student.goal}</p>}
      </div>

      <Link
        href={`/personal/alunos/${id}/avaliacoes`}
        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <span>
          <span className="font-semibold">Avaliações e evolução</span>
          <span className="block text-sm text-zinc-500">
            {lastAssessment
              ? `Última avaliação em ${formatDate(lastAssessment.assessed_at)}`
              : "Nenhuma avaliação ainda"}
          </span>
        </span>
        <span aria-hidden className="text-zinc-400">→</span>
      </Link>

      <Link
        href={`/personal/alunos/${id}/fotos`}
        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <span>
          <span className="font-semibold">Fotos de evolução</span>
          <span className="block text-sm text-zinc-500">Antes e depois, por data e ângulo</span>
        </span>
        <span aria-hidden className="text-zinc-400">→</span>
      </Link>

      <Link
        href={`/personal/alunos/${id}/frequencia`}
        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <span>
          <span className="font-semibold">Frequência (check-in / check-out)</span>
          <span className="block text-sm text-zinc-500">{trainingDaysText(student.training_days)}</span>
        </span>
        <span aria-hidden className="text-zinc-400">→</span>
      </Link>

      <Link
        href={`/personal/alunos/${id}/feedback`}
        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <span>
          <span className="font-semibold">Feedback semanal</span>
          <span className="block text-sm text-zinc-500">Como foi cada semana, com sua resposta</span>
        </span>
        <span aria-hidden className="text-zinc-400">→</span>
      </Link>

      <Link
        href={`/personal/alunos/${id}/mensagens`}
        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <span>
          <span className="font-semibold">Mensagens</span>
          <span className="block text-sm text-zinc-500">Conversa com {student.full_name}</span>
        </span>
        <span aria-hidden className="text-zinc-400">→</span>
      </Link>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Fichas de treino</h2>
        <Link
          href={`/personal/alunos/${id}/treinos/novo`}
          className={`${btnPrimaryCls} !h-10 !w-auto px-4 text-sm`}
        >
          Nova ficha
        </Link>
      </div>

      {error && <p className={errorCls}>Não foi possível carregar as fichas: {error.message}</p>}

      {!error && plans?.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhuma ficha ainda. Clique em “Nova ficha” para montar a primeira.
        </p>
      )}

      <ul className="space-y-2">
        {plans?.map((p) => {
          const s = PLAN_STATUS_LABEL[p.status];
          return (
            <li key={p.id}>
              <Link
                href={`/personal/alunos/${id}/treinos/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <span className="font-medium">{p.name}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
                  {s.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
