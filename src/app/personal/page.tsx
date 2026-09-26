import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Painel do Personal" };

export default async function PersonalHome() {
  const supabase = await createClient();

  // Contagens reais, já filtradas pela RLS (só os alunos deste Personal).
  const [total, pendentes, feedbacks] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "convidado"),
    supabase.from("weekly_checkins").select("id", { count: "exact", head: true }).is("replied_at", null),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Painel do Personal</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Alunos</p>
          <p className="text-3xl font-bold">{total.error ? "—" : (total.count ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Convites pendentes</p>
          <p className="text-3xl font-bold">{pendentes.error ? "—" : (pendentes.count ?? 0)}</p>
        </div>
      </div>

      <Link
        href="/personal/feedback"
        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <span>
          <span className="block text-sm text-zinc-500">Feedbacks aguardando resposta</span>
          <span className="text-3xl font-bold">{feedbacks.error ? "—" : (feedbacks.count ?? 0)}</span>
        </span>
        <span aria-hidden className="text-zinc-400">→</span>
      </Link>

      <Link
        href="/personal/treinos/volume"
        className="block rounded-xl border border-zinc-200 p-4 font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        Treinos · Análise de volume →
      </Link>

      <Link
        href="/personal/alunos"
        className="block rounded-xl border border-zinc-200 p-4 font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        Gerenciar alunos →
      </Link>
    </section>
  );
}
