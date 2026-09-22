import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { btnPrimaryCls, errorCls } from "@/lib/ui";
import ExerciseFilters from "./filters";
import ExerciseRowActions from "./exercise-actions";

export const metadata = { title: "Exercícios" };

const DIFFICULTY_LABEL: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default async function ExerciciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grupo?: string; equip?: string; arquivados?: string }>;
}) {
  const { q, grupo, equip, arquivados } = await searchParams;
  const supabase = await createClient();

  const [{ data: muscleGroups }, { data: equipment }] = await Promise.all([
    supabase.from("muscle_groups").select("id, name").order("sort_order"),
    supabase.from("equipment").select("id, name").order("sort_order"),
  ]);

  // A RLS já devolve só os exercícios visíveis a este Personal (globais + próprios).
  let query = supabase
    .from("exercises")
    .select(
      "id, name, difficulty, is_archived, primary_muscle_group_id, equipment_id, muscle_groups!exercises_primary_muscle_group_id_fkey(name), equipment(name), exercise_media(id)",
    )
    .eq("is_archived", arquivados === "1")
    .order("name");

  if (q) query = query.ilike("name", `%${q}%`);
  if (grupo) query = query.eq("primary_muscle_group_id", grupo);
  if (equip) query = query.eq("equipment_id", equip);

  const { data: exercises, error } = await query;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Exercícios</h1>
        <Link
          href="/personal/exercicios/novo"
          className={`${btnPrimaryCls} !h-11 !w-auto px-4 text-sm`}
        >
          Novo exercício
        </Link>
      </div>

      <ExerciseFilters muscleGroups={muscleGroups ?? []} equipment={equipment ?? []} />

      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/personal/exercicios"
          className={!arquivados ? "font-semibold underline" : "text-zinc-500"}
        >
          Ativos
        </Link>
        <span className="text-zinc-300">·</span>
        <Link
          href="/personal/exercicios?arquivados=1"
          className={arquivados === "1" ? "font-semibold underline" : "text-zinc-500"}
        >
          Arquivados
        </Link>
      </div>

      {error && <p className={errorCls}>Não foi possível carregar os exercícios: {error.message}</p>}

      {!error && exercises?.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhum exercício encontrado com esses filtros.
        </p>
      )}

      <ul className="space-y-3">
        {exercises?.map((ex) => (
          <li key={ex.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{ex.name}</p>
                <p className="text-sm text-zinc-500">
                  {ex.muscle_groups?.name}
                  {ex.equipment?.name ? ` · ${ex.equipment.name}` : ""} ·{" "}
                  {DIFFICULTY_LABEL[ex.difficulty]}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {ex.exercise_media?.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                    Com vídeo
                  </span>
                )}
                {ex.is_archived && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    Arquivado
                  </span>
                )}
              </div>
            </div>
            <ExerciseRowActions id={ex.id} archived={ex.is_archived} />
          </li>
        ))}
      </ul>
    </section>
  );
}
