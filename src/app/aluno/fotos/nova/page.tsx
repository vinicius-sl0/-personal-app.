import Link from "next/link";
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
      <div>
        <Link href="/aluno/fotos" className="text-sm text-muted underline">
          ← Voltar para Fotos
        </Link>
        <h1 className="mt-2 text-xl font-bold">Enviar fotos</h1>
        <p className="text-sm text-muted">
          Escolha as fotos que quiser (não precisa ter todas). Dica: mesma luz, mesma distância e
          mesma roupa facilitam a comparação.
        </p>
      </div>
      <PhotoUploadForm studentId={student.id} today={todayIso()} backHref="/aluno/fotos" />
    </section>
  );
}
