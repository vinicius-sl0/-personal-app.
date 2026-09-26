import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BarChart3, CalendarCheck, Dumbbell, Play } from "lucide-react";
import { btnPrimaryCls, btnSecondaryCls, cardCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";

export const metadata = { title: "Meus treinos" };

export default async function AlunoTreinosPage() {
  const supabase = await createClient();

  // A RLS só devolve o plano ATIVO do próprio aluno (política plans_select_aluno).
  const { data: plan, error } = await supabase
    .from("workout_plans")
    .select("id, name, objective")
    .eq("status", "ativo")
    .maybeSingle();

  if (error) {
    return <ErrorState message={`Não foi possível carregar seus treinos: ${error.message}`} />;
  }

  if (!plan) {
    return (
      <>
        <PageHeader eyebrow="Meu treino" title="Meus treinos" />
        <EmptyState
          icon={<Dumbbell className="size-5" />}
          title="Sua ficha ainda não está pronta"
          description="Seu Personal ainda não publicou uma ficha de treino para você. Assim que publicar, ela aparece aqui."
        />
      </>
    );
  }

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, name, notes, workout_exercises(id)")
    .eq("plan_id", plan.id)
    .order("position");

  // Última sessão de cada treino, para mostrar "Último treino: ..." (uma consulta simples por treino é aceitável no tamanho de uma ficha).
  const lastByWorkout = new Map<string, string>();
  if (workouts && workouts.length > 0) {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("workout_id, started_at")
      .in(
        "workout_id",
        workouts.map((w) => w.id),
      )
      .order("started_at", { ascending: false });
    for (const s of sessions ?? []) {
      if (s.workout_id && !lastByWorkout.has(s.workout_id)) {
        lastByWorkout.set(s.workout_id, s.started_at);
      }
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Meu treino"
        title={plan.name}
        description={plan.objective ?? undefined}
        actions={
          <>
            <Link href="/aluno/treinos/historico" className={btnSecondaryCls}>
              <CalendarCheck aria-hidden className="size-4" /> Frequência
            </Link>
            <Link href="/aluno/treinos/volume" className={btnSecondaryCls}>
              <BarChart3 aria-hidden className="size-4" /> Meu volume
            </Link>
          </>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {workouts?.map((w, i) => {
          const last = lastByWorkout.get(w.id);
          const n = w.workout_exercises?.length ?? 0;
          return (
            <li key={w.id} className={`${cardCls} flex flex-col p-5`}>
              <Link href={`/aluno/treinos/${w.id}`} className="group flex items-start gap-4">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-lg font-extrabold text-brand-ink">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-semibold group-hover:text-brand-ink">{w.name}</span>
                  <span className="block text-sm text-muted">
                    {n} {n === 1 ? "exercício" : "exercícios"} ·{" "}
                    {last ? `último em ${new Date(last).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "ainda não realizado"}
                  </span>
                </span>
              </Link>
              <div className="mt-4 flex gap-2">
                <Link href={`/aluno/treinos/${w.id}`} className={`${btnSecondaryCls} flex-1`}>
                  Ver exercícios
                </Link>
                <Link href={`/aluno/treinos/${w.id}/executar`} className={`${btnPrimaryCls} !h-11 flex-1 text-sm`}>
                  <Play aria-hidden className="size-4" /> Treinar
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
