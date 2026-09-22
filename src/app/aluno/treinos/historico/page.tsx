import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Histórico de treinos" };

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ concluido?: string }>;
}) {
  const { concluido } = await searchParams;
  const supabase = await createClient();

  // A RLS (sessions_select) só devolve as sessões do próprio aluno.
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, workout_name_snapshot, started_at, finished_at, status")
    .order("started_at", { ascending: false })
    .limit(30);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Histórico de treinos</h1>

      {concluido === "1" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Treino concluído. Bom trabalho!
        </p>
      )}

      {sessions?.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhum treino realizado ainda.
        </p>
      )}

      <ul className="space-y-2">
        {sessions?.map((s) => (
          <li key={s.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="font-medium">{s.workout_name_snapshot}</p>
            <p className="text-sm text-zinc-500">
              {new Date(s.started_at).toLocaleString("pt-BR")}
              {s.status === "concluida" ? " · concluído" : " · em andamento"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
