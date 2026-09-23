import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { hasPhotoConsent, loadPhotoSets } from "@/lib/photo-data";
import { btnPrimaryCls, errorCls } from "@/lib/ui";
import PhotoGallery from "@/components/photo-gallery";

export const metadata = { title: "Fotos de evolução" };

export default async function FotosAlunoPage({
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
  // Sem autorização a RLS não devolve nenhuma foto; nem consultamos.
  const { sets, error } = consent.active ? await loadPhotoSets(supabase, id) : { sets: [], error: null };

  return (
    <section className="space-y-4">
      <div>
        <Link href={`/personal/alunos/${id}`} className="text-sm text-zinc-500 underline">
          ← Voltar para {student.full_name}
        </Link>
        <h1 className="mt-2 text-xl font-bold">Fotos de evolução</h1>
      </div>

      {consent.error && (
        <p className={errorCls}>Não foi possível verificar a autorização: {consent.error.message}</p>
      )}

      {!consent.error && !consent.active && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {student.full_name} não autorizou as fotos de evolução (ou retirou a autorização). Só o
          próprio aluno pode autorizar, pelo app, na tela “Fotos”.
        </p>
      )}

      {consent.active && (
        <>
          <Link href={`/personal/alunos/${id}/fotos/nova`} className={btnPrimaryCls}>
            Enviar fotos
          </Link>

          {error && <p className={errorCls}>Não foi possível carregar as fotos: {error}</p>}

          {!error && sets.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Nenhuma foto ainda.
            </p>
          )}

          {!error && sets.length > 0 && <PhotoGallery sets={sets} canDelete={false} />}

          <p className="text-xs text-zinc-500">
            Apenas o aluno pode excluir fotos. Se precisar remover alguma, peça a ele.
          </p>
        </>
      )}
    </section>
  );
}
