import { createClient } from "@/lib/supabase/server";
import { createExercise } from "../actions";
import ExerciseForm from "../exercise-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Novo exercício" };

export default async function NovoExercicioPage() {
  const supabase = await createClient();
  const [{ data: muscleGroups }, { data: equipment }] = await Promise.all([
    supabase.from("muscle_groups").select("id, name").order("sort_order"),
    supabase.from("equipment").select("id, name").order("sort_order"),
  ]);

  return (
    <section className="space-y-4">
      <PageHeader
        back={{ href: "/personal/exercicios", label: "Voltar" }}
        title="Novo exercício"
      />
      <ExerciseForm
        action={createExercise}
        muscleGroups={muscleGroups ?? []}
        equipment={equipment ?? []}
        defaultValues={{
          name: "",
          primary_muscle_group_id: "",
          secondary_muscle_group_ids: [],
          equipment_id: "",
          difficulty: "iniciante",
          instructions: "",
          video_url: "",
          kcal_per_min: "",
        }}
        submitLabel="Cadastrar exercício"
      />
    </section>
  );
}
