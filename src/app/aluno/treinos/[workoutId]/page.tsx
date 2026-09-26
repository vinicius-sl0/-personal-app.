import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { btnPrimaryCls } from "@/lib/ui";
import { repsLabel, techniqueExplanation, type Technique } from "@/lib/workout-labels";

export const metadata = { title: "Treino" };

export default async function TreinoDetalhePage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const supabase = await createClient();

  // A RLS (workouts_select) só libera treinos de um plano ativo/encerrado do próprio aluno.
  const { data: workout } = await supabase
    .from("workouts")
    .select(
      "id, name, notes, workout_exercises(id, sets, reps_min, reps_max, reps_text, target_load_kg, rest_seconds, technique, technique_detail, notes, position, exercises(id, name, instructions))",
    )
    .eq("id", workoutId)
    .maybeSingle();

  if (!workout) notFound();

  const exercises = (workout.workout_exercises ?? []).slice().sort((a, b) => a.position - b.position);

  return (
    <section className="space-y-4">
      <Link href="/aluno/treinos" className="text-sm text-muted underline">
        ← Meus treinos
      </Link>
      <h1 className="text-xl font-bold">{workout.name}</h1>
      {workout.notes && <p className="text-sm text-muted">{workout.notes}</p>}

      <ul className="space-y-3">
        {exercises.map((we) => {
          const explanation = techniqueExplanation(we.technique as Technique, we.technique_detail);
          return (
            <li key={we.id} className="rounded-xl border border-line p-4 bg-card">
              <p className="font-semibold">{we.exercises?.name}</p>
              <p className="text-sm text-muted">
                {we.sets}× {repsLabel(we.reps_min, we.reps_max, we.reps_text)}
                {we.target_load_kg ? ` · ${we.target_load_kg} kg` : ""}
              </p>
              {explanation && (
                <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {explanation}
                </p>
              )}
              {we.notes && <p className="mt-2 text-xs text-muted">Obs.: {we.notes}</p>}
            </li>
          );
        })}
      </ul>

      <Link href={`/aluno/treinos/${workoutId}/executar`} className={btnPrimaryCls}>
        Iniciar treino
      </Link>
    </section>
  );
}
