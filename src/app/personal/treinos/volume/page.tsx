import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadSecondaryWeight } from "@/lib/volume-data";
import VolumeReport from "@/components/volume-report";
import { SecondaryWeightSelect, type VolumeQuery } from "@/components/volume-controls";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Análise de volume" };

export default async function VolumePage({ searchParams }: { searchParams: Promise<VolumeQuery> }) {
  const profile = await requireRole("personal");
  const query = await searchParams;
  const supabase = await createClient();

  const [{ data: students }, weight] = await Promise.all([
    supabase.from("students").select("id, full_name").neq("status", "arquivado").order("full_name"),
    loadSecondaryWeight(supabase, profile.id),
  ]);
  const student = students?.find((s) => s.id === query.aluno) ?? null;

  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Treinos" title="Análise de volume" actions={<SecondaryWeightSelect value={weight} />} />

      <VolumeReport
        role="personal"
        student={student}
        students={students ?? []}
        weight={weight}
        query={query}
        basePath="/personal/treinos/volume"
      />
    </section>
  );
}
