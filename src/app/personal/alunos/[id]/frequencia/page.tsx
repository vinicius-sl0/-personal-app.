import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import AttendanceView, { type AttendanceParams } from "@/components/attendance-view";
import TrainingDaysEditor from "./training-days-editor";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Frequência" };

export default async function FrequenciaAlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<AttendanceParams>;
}) {
  await requireRole("personal");
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, training_days, start_date")
    .eq("id", id)
    .maybeSingle();
  if (!student) notFound();

  return (
    <section className="space-y-4">
      <PageHeader
        back={{ href: `/personal/alunos/${id}`, label: `Voltar para ${student.full_name}` }}
        title="Frequência (check-in / check-out)"
      />

      <TrainingDaysEditor studentId={id} initial={student.training_days} />

      <AttendanceView
        studentId={id}
        trainingDays={student.training_days}
        since={student.start_date}
        basePath={`/personal/alunos/${id}/frequencia`}
        params={query}
      />
    </section>
  );
}
