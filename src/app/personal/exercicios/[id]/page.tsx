import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateExercise } from "../actions";
import ExerciseForm from "../exercise-form";

export const metadata = { title: "Editar exercício" };

export default async function EditarExercicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // A RLS decide se este Personal pode ver o exercício; se não puder, vem vazio.
  const [{ data: exercise }, { data: muscleGroups }, { data: equipment }, { data: secondary }, { data: media }] =
    await Promise.all([
      supabase
        .from("exercises")
        .select("id, name, instructions, primary_muscle_group_id, equipment_id, difficulty, owner_id")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("muscle_groups").select("id, name").order("sort_order"),
      supabase.from("equipment").select("id, name").order("sort_order"),
      supabase.from("exercise_muscle_groups").select("muscle_group_id").eq("exercise_id", id),
      supabase.from("exercise_media").select("url").eq("exercise_id", id).eq("position", 0).maybeSingle(),
    ]);

  if (!exercise) notFound();

  const readOnly = !exercise.owner_id; // exercício global (não deveria existir mais, mas fica a proteção

  return (
    <section className="space-y-4">
      <div>
        <Link href="/personal/exercicios" className="text-sm text-zinc-500 underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-xl font-bold">Editar exercício</h1>
      </div>

      {readOnly ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Este é um exercício global e não pode ser editado. Use “Duplicar” na lista para criar sua
          própria versão.
        </p>
      ) : (
        <ExerciseForm
          action={updateExercise}
          muscleGroups={muscleGroups ?? []}
          equipment={equipment ?? []}
          defaultValues={{
            id: exercise.id,
            name: exercise.name,
            primary_muscle_group_id: exercise.primary_muscle_group_id ?? "",
            secondary_muscle_group_ids: (secondary ?? []).map((s) => s.muscle_group_id),
            equipment_id: exercise.equipment_id ?? "",
            difficulty: exercise.difficulty,
            instructions: exercise.instructions ?? "",
            video_url: media?.url ?? "",
          }}
          submitLabel="Salvar alterações"
        />
      )}
    </section>
  );
}
