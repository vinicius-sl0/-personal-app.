import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/leads";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState } from "@/components/ui/states";
import LeadCard from "./lead-card";

export const metadata = { title: "Interessados" };

// Data limite da Política de Privacidade: interessado que não virou aluno é excluído em até 12 meses.
function retentionCutoff() {
  return Date.now() - 365 * 86400000;
}

// Quem preencheu "Quero me tornar aluno" na página inicial. A RLS devolve só os deste Personal.
export default async function InteressadosPage({ searchParams }: { searchParams: Promise<{ situacao?: string }> }) {
  await requireRole("personal");
  const { situacao } = await searchParams;
  const filter = LEAD_STATUSES.some((s) => s.value === situacao) ? situacao! : "todos";
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, full_name, whatsapp, goal, experience, days_per_week, modality, status, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const all = leads ?? [];
  const count = (s: string) => all.filter((l) => l.status === s).length;
  const shown = filter === "todos" ? all : all.filter((l) => l.status === filter);
  const yearAgo = retentionCutoff();

  return (
    <section>
      <PageHeader
        title="Interessados"
        description="Quem respondeu “Quero me tornar aluno” na página inicial. Acompanhe a conversa e marque quem virou aluno."
      />

      {error ? (
        <ErrorState title="Não foi possível carregar os interessados" message={error.message} />
      ) : all.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="size-5" />}
          title="Nenhum interessado ainda"
          description="Quando alguém responder as perguntas do botão “Quero me tornar aluno” na página inicial, aparece aqui e você recebe um aviso no sino."
        />
      ) : (
        <div className="space-y-4">
          <LinkTabs
            label="Filtrar por situação"
            active={filter}
            tabs={[
              { key: "todos", label: `Todos (${all.length})`, href: "/personal/interessados" },
              ...LEAD_STATUSES.map((s) => ({
                key: s.value,
                label: `${s.label} (${count(s.value)})`,
                href: `/personal/interessados?situacao=${s.value}`,
              })),
            ]}
          />
          {shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Ninguém nesta situação.</p>
          ) : (
            <ul className="space-y-3">
              {shown.map((l) => (
                <li key={l.id}>
                  <LeadCard lead={l} expired={l.status !== "virou_aluno" && Date.parse(l.created_at) < yearAgo} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
