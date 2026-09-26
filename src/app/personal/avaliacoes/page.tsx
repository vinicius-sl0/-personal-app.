import { Ruler } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/assessment";
import { PageHeader } from "@/components/ui/page-header";
import { ListLink } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";

export const metadata = { title: "Avaliações" };

// Visão geral: última avaliação de cada aluno. Detalhes e gráficos ficam na página de cada um.
export default async function AvaliacoesPage() {
  await requireRole("personal");
  const supabase = await createClient();

  const [{ data: students, error }, { data: assessments }] = await Promise.all([
    supabase.from("students").select("id, full_name, status").neq("status", "arquivado").order("full_name"),
    supabase.from("assessments").select("student_id, assessed_at").order("assessed_at", { ascending: false }),
  ]);

  const last = new Map<string, { date: string; count: number }>();
  for (const a of assessments ?? []) {
    const cur = last.get(a.student_id);
    last.set(a.student_id, { date: cur?.date ?? a.assessed_at, count: (cur?.count ?? 0) + 1 });
  }

  return (
    <>
      <PageHeader
        eyebrow="Avaliações"
        title="Avaliações físicas"
        description="Antropometria e composição corporal de cada aluno, com histórico e gráficos."
      />

      {error && <ErrorState message={`Não foi possível carregar os alunos: ${error.message}`} />}
      {!error && students?.length === 0 && (
        <EmptyState icon={<Ruler className="size-5" />} title="Nenhum aluno ainda" description="Cadastre alunos para registrar avaliações." />
      )}

      <ul className="grid gap-2 md:grid-cols-2">
        {students?.map((s) => {
          const info = last.get(s.id);
          return (
            <li key={s.id}>
              <ListLink
                href={`/personal/alunos/${s.id}/avaliacoes`}
                aside={info ? <Badge tone="neutral">{info.count} {info.count === 1 ? "avaliação" : "avaliações"}</Badge> : <Badge tone="warning">Sem avaliação</Badge>}
              >
                <span className="flex items-center gap-3">
                  <Avatar name={s.full_name} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.full_name}</span>
                    <span className="block text-sm text-muted">
                      {info ? `Última em ${formatDate(info.date)}` : "Nenhuma avaliação registrada"}
                    </span>
                  </span>
                </span>
              </ListLink>
            </li>
          );
        })}
      </ul>
    </>
  );
}
