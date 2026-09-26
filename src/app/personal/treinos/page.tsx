import Link from "next/link";
import { Dumbbell, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/assessment";
import { btnPrimaryCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { ListLink } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";

export const metadata = { title: "Meus treinos" };

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  ativo: { label: "Ativa", tone: "success" },
  rascunho: { label: "Rascunho", tone: "warning" },
  encerrado: { label: "Encerrada", tone: "neutral" },
  arquivado: { label: "Arquivada", tone: "neutral" },
};

const FILTERS = [
  { key: "ativo", label: "Ativas" },
  { key: "rascunho", label: "Rascunhos" },
  { key: "encerrado", label: "Encerradas" },
  { key: "todas", label: "Todas" },
];

export default async function MeusTreinosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("personal");
  const { status: raw } = await searchParams;
  const status = FILTERS.some((f) => f.key === raw) ? raw! : "ativo";
  const supabase = await createClient();

  let query = supabase
    .from("workout_plans")
    .select("id, name, status, created_at, student_id, students(full_name), workouts(count)")
    .eq("is_template", false)
    .order("created_at", { ascending: false });
  if (status !== "todas") query = query.eq("status", status as "ativo" | "rascunho" | "encerrado");
  const { data: plans, error } = await query;

  return (
    <>
      <PageHeader
        eyebrow="Treinos"
        title="Meus treinos"
        description="Todas as fichas de treino dos seus alunos."
        actions={
          <Link href="/personal/treinos/novo" className={`${btnPrimaryCls} !h-11 !w-auto px-5 text-sm`}>
            <Plus aria-hidden className="size-4" /> Criar treino
          </Link>
        }
      />

      <div className="space-y-4">
        <LinkTabs
          label="Filtrar fichas"
          active={status}
          tabs={FILTERS.map((f) => ({ key: f.key, label: f.label, href: `/personal/treinos?status=${f.key}` }))}
        />

        {error && <ErrorState message={`Não foi possível carregar as fichas: ${error.message}`} />}

        {!error && plans?.length === 0 && (
          <EmptyState
            icon={<Dumbbell className="size-5" />}
            title="Nenhuma ficha aqui"
            description="Crie uma ficha escolhendo o aluno e montando os treinos A, B, C..."
            action={
              <Link href="/personal/treinos/novo" className={`${btnPrimaryCls} !h-11 !w-auto px-5 text-sm`}>
                Criar treino
              </Link>
            }
          />
        )}

        <ul className="grid gap-2 md:grid-cols-2">
          {plans?.map((p) => {
            const s = STATUS[p.status] ?? STATUS.encerrado;
            const workouts = p.workouts?.[0]?.count ?? 0;
            return (
              <li key={p.id}>
                <ListLink href={`/personal/alunos/${p.student_id}/treinos/${p.id}`} aside={<Badge tone={s.tone} dot>{s.label}</Badge>}>
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="block truncate text-sm text-muted">
                    {p.students?.full_name ?? "Aluno"} · {workouts} {workouts === 1 ? "treino" : "treinos"} · criada em{" "}
                    {formatDate(p.created_at.slice(0, 10))}
                  </span>
                </ListLink>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
