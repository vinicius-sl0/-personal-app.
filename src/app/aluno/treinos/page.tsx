import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { errorCls } from "@/lib/ui";

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
    return <p className={errorCls}>Não foi possível carregar seus treinos: {error.message}</p>;
  }

  if (!plan) {
    return (
      <section className="space-y-3">
        <h1 className="text-xl font-bold">Meus treinos</h1>
        <Link href="/aluno/treinos/historico" className="inline-block text-sm underline">
          Ver minha frequência e histórico →
        </Link>
        <Link href="/aluno/treinos/volume" className="mt-1 block text-sm underline">
          📊 Meu volume de treino →
        </Link>
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Seu Personal ainda não publicou uma ficha de treino para você.
        </p>
      </section>
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
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{plan.name}</h1>
        {plan.objective && <p className="text-sm text-zinc-500">{plan.objective}</p>}
        <Link href="/aluno/treinos/historico" className="mt-1 inline-block text-sm underline">
          Ver minha frequência e histórico →
        </Link>
        <Link href="/aluno/treinos/volume" className="mt-1 block text-sm underline">
          📊 Meu volume de treino →
        </Link>
      </div>

      <ul className="space-y-3">
        {workouts?.map((w) => {
          const last = lastByWorkout.get(w.id);
          return (
            <li key={w.id}>
              <Link
                href={`/aluno/treinos/${w.id}`}
                className="block rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <p className="font-semibold">{w.name}</p>
                <p className="text-sm text-zinc-500">
                  {w.workout_exercises?.length ?? 0} exercícios
                  {last
                    ? ` · último treino em ${new Date(last).toLocaleDateString("pt-BR")}`
                    : " · ainda não realizado"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
