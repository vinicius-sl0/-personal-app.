import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET, type PhotoSetView } from "@/lib/photos";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// A autorização "fotos_evolucao" está ativa (aceita e não revogada)?
export async function hasPhotoConsent(supabase: Supabase, studentId: string) {
  const { data, error } = await supabase
    .from("consents")
    .select("id")
    .eq("student_id", studentId)
    .eq("type", "fotos_evolucao")
    .is("revoked_at", null)
    .limit(1);
  return { active: (data?.length ?? 0) > 0, error };
}

// Conjuntos de fotos do aluno, do mais recente para o mais antigo, já com URLs assinadas.
// A RLS decide o que volta: o aluno vê as dele; o Personal, só com autorização ativa.
export async function loadPhotoSets(
  supabase: Supabase,
  studentId: string,
  opts: { from?: string } = {},
): Promise<{ sets: PhotoSetView[]; error: string | null }> {
  let query = supabase
    .from("progress_photo_sets")
    .select("id, taken_at, notes, progress_photos(id, angle, storage_path)")
    .eq("student_id", studentId)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts.from) query = query.gte("taken_at", opts.from);

  const { data, error } = await query;

  if (error) return { sets: [], error: error.message };

  const paths = data.flatMap((s) => s.progress_photos.map((p) => p.storage_path));
  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(paths, 60 * 60);
    if (signError) return { sets: [], error: signError.message };
    for (const s of signed) {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }
  }

  const sets = data.map((s) => ({
    id: s.id,
    taken_at: s.taken_at,
    notes: s.notes,
    photos: s.progress_photos.map((p) => ({
      id: p.id,
      angle: p.angle,
      url: urlByPath.get(p.storage_path) ?? null,
    })),
  }));
  return { sets, error: null };
}
