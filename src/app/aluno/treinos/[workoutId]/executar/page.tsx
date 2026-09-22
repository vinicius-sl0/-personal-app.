import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExecuteWorkout, { type ExecExercise } from "./execute-workout";
import type { Technique } from "@/lib/workout-labels";

export const metadata = { title: "Treinando" };

export default async function ExecutarTreinoPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select(
      "id, name, workout_exercises(id, exercise_id, sets, reps_min, reps_max, reps_text, target_load_kg, rest_seconds, technique, technique_detail, notes, position, exercises(id, name, instructions, exercise_media(url, position)))",
    )
    .eq("id", workoutId)
    .maybeSingle();

  if (!workout) notFound();

  const exercises: ExecExercise[] = (workout.workout_exercises ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((we) => {
      const video = (we.exercises?.exercise_media ?? []).find((m) => m.position === 0);
      return {
        workout_exercise_id: we.id,
        exercise_id: we.exercise_id,
        name: we.exercises?.name ?? "Exercício",
        instructions: we.exercises?.instructions ?? null,
        video_url: video?.url ?? null,
        sets: we.sets,
        reps_min: we.reps_min,
        reps_max: we.reps_max,
        reps_text: we.reps_text,
        target_load_kg: we.target_load_kg,
        rest_seconds: we.rest_seconds,
        technique: we.technique as Technique,
        technique_detail: we.technique_detail,
        notes: we.notes,
      };
    });

  if (exercises.length === 0) notFound();

  return <ExecuteWorkout workoutId={workoutId} workoutName={workout.name} exercises={exercises} />;
}
