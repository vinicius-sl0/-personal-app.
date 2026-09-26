import { PageHeader } from "@/components/ui/page-header";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { hasPhotoConsent } from "@/lib/photo-data";
import { todayIso } from "@/lib/assessment";
import PhotoUploadForm from "@/components/photo-upload-form";

export const metadata = { title: "Enviar fotos" };

export default async function NovasFotosAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("personal");
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", id).maybeSingle();
  if (!student) notFound();

  const consent = await hasPhotoConsent(supabase, id);
  if (!consent.active) redirect(`/personal/alunos/${id}/fotos`);

  return (
    <section className="space-y-4">
      <PageHeader back={{ href: `/personal/alunos/${id}/fotos`, label: "Fotos" }} title="Enviar fotos" description={student.full_name} />
      <PhotoUploadForm studentId={id} today={todayIso()} backHref={`/personal/alunos/${id}/fotos`} />
    </section>
  );
}
