import { createClient } from "@/lib/supabase/server";
import { trainingDaysText } from "@/lib/attendance";
import { errorCls } from "@/lib/ui";
import AttendanceView, { type AttendanceParams } from "@/components/attendance-view";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Minha frequência" };

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<AttendanceParams & { concluido?: string }>;
}) {
  const { concluido, ...query } = await searchParams;
  const supabase = await createClient();

  // A RLS só devolve o cadastro do próprio aluno.
  const { data: student } = await supabase.from("students").select("id, training_days, start_date").maybeSingle();
  if (!student) return <p className={errorCls}>Cadastro de aluno não encontrado.</p>;

  return (
    <section className="space-y-4">
      <PageHeader title="Minha frequência" description={<>Dias combinados: {trainingDaysText(student.training_days)}</>} />

      {concluido === "1" && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-3 py-2 text-sm">
          Check-out feito. Treino concluído, bom trabalho!
        </p>
      )}

      <AttendanceView
        studentId={student.id}
        trainingDays={student.training_days}
        since={student.start_date}
        basePath="/aluno/treinos/historico"
        params={query}
      />
    </section>
  );
}
