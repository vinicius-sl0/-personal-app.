import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadMuscleMap, loadSecondaryWeight } from "@/lib/volume-data";
import PlanEditor from "../plan-editor";
import { createPlan } from "../actions";
import type { ExerciseOption } from "@/components/exercise-picker";

export const metadata = { title: "Nova ficha" };

export default async function NovaFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("personal");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: exercisesRaw }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("id", id).maybeSingle(),
    supabase
      .from("exercises")
      .select("id, name, muscle_groups!exercises_primary_muscle_group_id_fkey(name), equipment(name)")
      .eq("is_archived", false)
      .order("name"),
  ]);

  if (!student) notFound();

  const exercises: ExerciseOption[] = (exercisesRaw ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    muscle_group: e.muscle_groups?.name ?? null,
    equipment: e.equipment?.name ?? null,
  }));
  const exerciseIndex = Object.fromEntries(exercises.map((e) => [e.id, e]));
  // Para o "Resumo do treino" (volume por grupo muscular) dentro do editor.
  const [{ map: muscleMap }, secondaryWeight] = await Promise.all([
    loadMuscleMap(supabase, exercises.map((e) => e.id)),
    loadSecondaryWeight(supabase, profile.id),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Nova ficha para {student.full_name}</h1>
      <PlanEditor
        studentId={id}
        studentName={student.full_name}
        exercises={exercises}
        exerciseIndex={exerciseIndex}
        muscleMap={muscleMap}
        secondaryWeight={secondaryWeight}
        action={createPlan.bind(null, id)}
      />
    </section>
  );
}
