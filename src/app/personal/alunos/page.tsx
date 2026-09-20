import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { btnPrimaryCls, errorCls } from "@/lib/ui";
import InviteButton from "./invite-button";

export const metadata = { title: "Alunos" };

const STATUS = {
  convidado: { label: "Convite pendente", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200" },
  ativo: { label: "Ativo", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" },
  pausado: { label: "Pausado", cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  arquivado: { label: "Arquivado", cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
} as const;

export default async function AlunosPage() {
  const supabase = await createClient();

  // A RLS devolve somente os alunos deste Personal.
  const { data: students, error } = await supabase
    .from("students")
    .select("id, full_name, email, phone, status")
    .order("full_name");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Alunos</h1>
        <Link href="/personal/alunos/novo" className={`${btnPrimaryCls} !h-11 !w-auto px-4 text-sm`}>
          Novo aluno
        </Link>
      </div>

      {error && <p className={errorCls}>Não foi possível carregar os alunos: {error.message}</p>}

      {!error && students?.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhum aluno ainda. Clique em “Novo aluno” para cadastrar o primeiro.
        </p>
      )}

      <ul className="space-y-3">
        {students?.map((s) => (
          <li key={s.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.full_name}</p>
                <p className="truncate text-sm text-zinc-500">{s.email}</p>
                {s.phone && <p className="text-sm text-zinc-500">{s.phone}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS[s.status].cls}`}>
                {STATUS[s.status].label}
              </span>
            </div>
            {s.status === "convidado" && <InviteButton studentId={s.id} />}
          </li>
        ))}
      </ul>
    </section>
  );
}
