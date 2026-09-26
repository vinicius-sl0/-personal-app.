import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPhotoConsent } from "@/lib/photo-data";
import { todayIso } from "@/lib/assessment";
import { errorCls } from "@/lib/ui";
import PhotoUploadForm from "@/components/photo-upload-form";

export const metadata = { title: "Enviar fotos" };

export default async function NovasFotosPage() {
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id").maybeSingle();
  if (!student) {
    return <p className={errorCls}>Cadastro de aluno não encontrado.</p>;
  }

  const consent = await hasPhotoConsent(supabase, student.id);
  if (!consent.active) redirect("/aluno/fotos");

  return (
    <section className="space-y-4">
      <PageHeader
        back={{ href: "/aluno/fotos", label: "Fotos" }}
        title="Enviar fotos"
        description="Escolha as fotos que quiser (não precisa ter todas). Dica: mesma luz, mesma distância e mesma roupa facilitam a comparação."
      />
      <PhotoUploadForm studentId={student.id} today={todayIso()} backHref="/aluno/fotos" />
    </section>
  );
}
