import Link from "next/link";
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
      <div>
        <Link href={`/personal/alunos/${id}/fotos`} className="text-sm text-zinc-500 underline">
          ← Voltar para Fotos
        </Link>
        <h1 className="mt-2 text-xl font-bold">Enviar fotos</h1>
        <p className="text-sm text-zinc-500">{student.full_name}</p>
      </div>
      <PhotoUploadForm studentId={id} today={todayIso()} backHref={`/personal/alunos/${id}/fotos`} />
    </section>
  );
}
