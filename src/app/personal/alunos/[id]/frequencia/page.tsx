import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import AttendanceView, { type AttendanceParams } from "@/components/attendance-view";
import TrainingDaysEditor from "./training-days-editor";

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
      <div>
        <Link href={`/personal/alunos/${id}`} className="text-sm text-muted underline">
          ← Voltar para {student.full_name}
        </Link>
        <h1 className="mt-2 text-xl font-bold">Frequência (check-in / check-out)</h1>
      </div>

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
