import Link from "next/link";
import { Archive, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadMuscleMap, loadSecondaryWeight } from "@/lib/volume-data";
import PlanEditor from "../plan-editor";
import { updatePlan, archivePlan } from "../actions";
import { PLAN_STATUS_LABEL } from "@/lib/workout-labels";
import { btnSecondaryCls } from "@/lib/ui";
import type { ExerciseOption } from "@/components/exercise-picker";

export const metadata = { title: "Ficha de treino" };

export default async function FichaPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const profile = await requireRole("personal");
  const { id, planId } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: plan }, { data: exercisesRaw }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("id", id).maybeSingle(),
    supabase
      .from("workout_plans")
      .select("id, name, objective, status, student_id")
      .eq("id", planId)
      .maybeSingle(),
    supabase
      .from("exercises")
      .select("id, name, muscle_groups!exercises_primary_muscle_group_id_fkey(name), equipment(name)")
      .eq("is_archived", false)
      .order("name"),
  ]);

  if (!student || !plan || plan.student_id !== id) notFound();

  const { data: workouts } = await supabase
    .from("workouts")
    .select(
      "id, name, notes, position, workout_exercises(id, exercise_id, position, sets, reps_min, reps_max, reps_text, target_load_kg, rest_seconds, technique, technique_detail, notes)",
    )
    .eq("plan_id", planId)
    .order("position");

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

  const initialPlan = {
    name: plan.name,
    objective: plan.objective,
    workouts: (workouts ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((w) => ({
        name: w.name,
        notes: w.notes,
        exercises: (w.workout_exercises ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((we) => ({
            exercise_id: we.exercise_id,
            sets: we.sets,
            reps_min: we.reps_min,
            reps_max: we.reps_max,
            reps_text: we.reps_text,
            target_load_kg: we.target_load_kg,
            rest_seconds: we.rest_seconds,
            technique: we.technique as "normal" | "dropset" | "biset" | "restpause",
            technique_detail: we.technique_detail,
            notes: we.notes,
          })),
      })),
  };

  const statusInfo = PLAN_STATUS_LABEL[plan.status];

  return (
    <section>
      <PageHeader
        eyebrow={`Ficha de ${student.full_name}`}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {plan.name}
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.cls}`}>{statusInfo.label}</span>
          </span>
        }
        actions={
          <>
            <Link href={`/personal/treinos/volume?aluno=${id}`} className={btnSecondaryCls}>
              <BarChart3 aria-hidden className="size-4" /> Análise de volume
            </Link>
            {plan.status !== "arquivado" && (
              <form action={archivePlan}>
                <input type="hidden" name="plan_id" value={plan.id} />
                <input type="hidden" name="student_id" value={id} />
                <button className={btnSecondaryCls}>
                  <Archive aria-hidden className="size-4" /> Arquivar
                </button>
              </form>
            )}
          </>
        }
      />

      <PlanEditor
        studentId={id}
        studentName={student.full_name}
        exercises={exercises}
        exerciseIndex={exerciseIndex}
        muscleMap={muscleMap}
        secondaryWeight={secondaryWeight}
        action={updatePlan.bind(null, id, planId)}
        initialPlan={initialPlan}
        planId={planId}
      />
    </section>
  );
}
