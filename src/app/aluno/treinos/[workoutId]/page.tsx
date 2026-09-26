import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Play } from "lucide-react";
import { btnPrimaryCls, cardCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
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

  const totalSets = exercises.reduce((n, e) => n + e.sets, 0);

  return (
    <div className="pb-28">
      <PageHeader
        back={{ href: "/aluno/treinos", label: "Meus treinos" }}
        eyebrow="Treino"
        title={workout.name}
        description={`${exercises.length} ${exercises.length === 1 ? "exercício" : "exercícios"} · ${totalSets} séries${workout.notes ? ` · ${workout.notes}` : ""}`}
      />

      <ol className="space-y-3">
        {exercises.map((we, i) => {
          const explanation = techniqueExplanation(we.technique as Technique, we.technique_detail);
          return (
            <li key={we.id} className={`${cardCls} p-4`}>
              <div className="flex items-start gap-3">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-subtle-strong text-sm font-bold text-soft">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{we.exercises?.name}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <li className="rounded-lg bg-subtle px-2 py-1">
                      <span className="text-muted">Séries </span>
                      <strong>{we.sets}</strong>
                    </li>
                    <li className="rounded-lg bg-subtle px-2 py-1">
                      <span className="text-muted">Reps </span>
                      <strong>{repsLabel(we.reps_min, we.reps_max, we.reps_text)}</strong>
                    </li>
                    {we.target_load_kg ? (
                      <li className="rounded-lg bg-subtle px-2 py-1">
                        <span className="text-muted">Carga </span>
                        <strong>{we.target_load_kg} kg</strong>
                      </li>
                    ) : null}
                    {we.rest_seconds ? (
                      <li className="rounded-lg bg-subtle px-2 py-1">
                        <span className="text-muted">Descanso </span>
                        <strong>{we.rest_seconds}s</strong>
                      </li>
                    ) : null}
                  </ul>
                  {explanation && (
                    <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-xs">
                      <strong className="text-brand-ink">Técnica:</strong> {explanation}
                    </p>
                  )}
                  {we.notes && <p className="mt-2 text-xs text-soft">Obs.: {we.notes}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto max-w-2xl">
          <Link href={`/aluno/treinos/${workoutId}/executar`} className={btnPrimaryCls}>
            <Play aria-hidden className="size-5" /> Fazer check-in e começar
          </Link>
        </div>
      </div>
    </div>
  );
}
