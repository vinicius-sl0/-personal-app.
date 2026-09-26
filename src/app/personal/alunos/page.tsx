import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { localDate } from "@/lib/attendance";
import { btnPrimaryCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/states";
import StudentsBrowser, { type StudentRow } from "./students-browser";

export const metadata = { title: "Alunos" };

export default async function AlunosPage() {
  await requireRole("personal");
  const supabase = await createClient();

  // A RLS devolve somente os alunos (e registros) deste Personal.
  const [studentsRes, sessionsRes, assessmentsRes] = await Promise.all([
    supabase.from("students").select("id, full_name, email, phone, status, goal, created_at").order("full_name"),
    supabase.from("workout_sessions").select("student_id, started_at").eq("status", "concluida").order("started_at", { ascending: false }).limit(2000),
    supabase.from("assessments").select("student_id, assessed_at").order("assessed_at", { ascending: false }).limit(2000),
  ]);

  const lastWorkout = new Map<string, string>();
  for (const s of sessionsRes.data ?? []) if (!lastWorkout.has(s.student_id)) lastWorkout.set(s.student_id, localDate(s.started_at));
  const lastAssessment = new Map<string, string>();
  for (const a of assessmentsRes.data ?? []) if (!lastAssessment.has(a.student_id)) lastAssessment.set(a.student_id, a.assessed_at);

  const rows: StudentRow[] = (studentsRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.full_name,
    email: s.email,
    phone: s.phone,
    status: s.status,
    goal: s.goal,
    createdAt: s.created_at,
    lastWorkout: lastWorkout.get(s.id) ?? null,
    lastAssessment: lastAssessment.get(s.id) ?? null,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Alunos"
        title="Seus alunos"
        description="Busque, filtre e acompanhe cada aluno."
        actions={
          <Link href="/personal/alunos/novo" className={`${btnPrimaryCls} !h-11 !w-auto px-5 text-sm`}>
            <UserPlus aria-hidden className="size-4" /> Novo aluno
          </Link>
        }
      />
      {studentsRes.error ? (
        <ErrorState message={`Não foi possível carregar os alunos: ${studentsRes.error.message}`} />
      ) : (
        <StudentsBrowser students={rows} />
      )}
    </>
  );
}
