import Link from "next/link";
import StudentForm from "./student-form";

export const metadata = { title: "Novo aluno" };

export default function NovoAlunoPage() {
  return (
    <section className="space-y-4">
      <div>
        <Link href="/personal/alunos" className="text-sm text-muted underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-xl font-bold">Novo aluno</h1>
      </div>
      <StudentForm />
    </section>
  );
}
