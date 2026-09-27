import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadSecondaryWeight } from "@/lib/volume-data";
import VolumeReport from "@/components/volume-report";
import type { VolumeQuery } from "@/components/volume-controls";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Meu volume de treino" };

export default async function MeuVolumePage({ searchParams }: { searchParams: Promise<VolumeQuery> }) {
  await requireRole("aluno");
  const query: VolumeQuery = { ...(await searchParams), aluno: undefined }; // o aluno só vê os próprios dados
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase.from("students").select("id, full_name, personal_id").maybeSingle();
  // Configuração dos grupos secundários é do Personal (o aluno só lê).
  const weight = student ? await loadSecondaryWeight(supabase, student.personal_id) : 0.5;

  return (
    <section className="space-y-4">
      <PageHeader
        back={{ href: "/aluno/treinos", label: "Voltar para Treinos" }}
        title="Meu volume de treino"
        description="Quanto você treina cada grupo muscular: o que está na sua ficha e o que você realmente fez."
      />

      <VolumeReport
        role="aluno"
        student={student ? { id: student.id, full_name: student.full_name } : null}
        weight={weight}
        query={query}
        basePath="/aluno/treinos/volume"
      />
    </section>
  );
}
