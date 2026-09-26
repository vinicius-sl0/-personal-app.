import { createClient } from "@/lib/supabase/server";
import { trainingDaysText } from "@/lib/attendance";
import { errorCls } from "@/lib/ui";
import AttendanceView, { type AttendanceParams } from "@/components/attendance-view";

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
      <div>
        <h1 className="text-xl font-bold">Minha frequência</h1>
        <p className="text-sm text-muted">Dias combinados: {trainingDaysText(student.training_days)}</p>
      </div>

      {concluido === "1" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
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
