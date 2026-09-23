import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasPhotoConsent, loadPhotoSets } from "@/lib/photo-data";
import { btnPrimaryCls, errorCls } from "@/lib/ui";
import PhotoGallery from "@/components/photo-gallery";
import ConsentToggle from "./consent-toggle";

export const metadata = { title: "Minhas fotos" };

export default async function MinhasFotosPage() {
  const supabase = await createClient();

  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase.from("students").select("id").maybeSingle();
  if (!student) {
    return <p className={errorCls}>Cadastro de aluno não encontrado.</p>;
  }

  const [consent, { sets, error }] = await Promise.all([
    hasPhotoConsent(supabase, student.id),
    loadPhotoSets(supabase, student.id),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Fotos de evolução</h1>

      <div className="space-y-3 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        {consent.error ? (
          <p className={errorCls}>Não foi possível verificar sua autorização: {consent.error.message}</p>
        ) : consent.active ? (
          <p>
            <strong>Autorização ativa.</strong> Você e seu Personal podem enviar fotos, e ele pode
            vê-las. Você pode retirar a autorização quando quiser.
          </p>
        ) : (
          <p>
            <strong>Sem autorização.</strong> Para enviar fotos de evolução, é preciso autorizar.
            Com a autorização, seu Personal também pode ver e enviar suas fotos. Sem ela, fotos
            antigas continuam visíveis só para você.
          </p>
        )}
        {!consent.error && <ConsentToggle active={consent.active} />}
      </div>

      {consent.active && (
        <Link href="/aluno/fotos/nova" className={btnPrimaryCls}>
          Enviar novas fotos
        </Link>
      )}

      {error && <p className={errorCls}>Não foi possível carregar suas fotos: {error}</p>}

      {!error && sets.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhuma foto ainda.
        </p>
      )}

      {!error && sets.length > 0 && <PhotoGallery sets={sets} canDelete />}
    </section>
  );
}
