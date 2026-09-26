import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadSecondaryWeight } from "@/lib/volume-data";
import VolumeReport from "@/components/volume-report";
import { SecondaryWeightSelect, type VolumeQuery } from "@/components/volume-controls";

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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Treinos</p>
          <h1 className="text-xl font-bold">Análise de volume</h1>
        </div>
        <SecondaryWeightSelect value={weight} />
      </div>

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
