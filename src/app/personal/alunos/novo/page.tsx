import StudentForm from "./student-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Novo aluno" };

export default function NovoAlunoPage() {
  return (
    <section className="space-y-4">
      <PageHeader
        back={{ href: "/personal/alunos", label: "Voltar" }}
        title="Novo aluno"
      />
      <StudentForm />
    </section>
  );
}
