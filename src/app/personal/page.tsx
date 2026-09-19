import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Painel do Personal" };

export default async function PersonalHome() {
  const supabase = await createClient();

  // Consulta real ao banco, já filtrada pela RLS (só os alunos deste Personal).
  const { count, error } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Painel do Personal</h1>
      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Alunos cadastrados</p>
        <p className="text-3xl font-bold">{error ? "—" : (count ?? 0)}</p>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            Não foi possível consultar o banco: {error.message}
          </p>
        )}
      </div>
      <p className="text-sm text-zinc-500">
        Conexão com o Supabase funcionando. Próximo passo: cadastro de alunos.
      </p>
    </section>
  );
}
