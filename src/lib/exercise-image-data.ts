import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { EXERCISE_IMAGE_POSITION, EXERCISE_MEDIA_BUCKET } from "@/lib/exercise-media";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Links temporários (1 h) das imagens dos exercícios. A RLS/Storage decide quem pode ver:
// o Personal dono e o aluno que tem o exercício em um treino dele.
export async function loadExerciseImages(supabase: Supabase, exerciseIds: string[]): Promise<Record<string, string>> {
  const ids = [...new Set(exerciseIds)];
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("exercise_media")
    .select("exercise_id, storage_path")
    .in("exercise_id", ids)
    .eq("kind", "imagem")
    .eq("position", EXERCISE_IMAGE_POSITION);
  const rows = (data ?? []).filter((r): r is { exercise_id: string; storage_path: string } => !!r.storage_path);
  if (rows.length === 0) return {};
  const { data: signed } = await supabase.storage.from(EXERCISE_MEDIA_BUCKET).createSignedUrls(rows.map((r) => r.storage_path), 60 * 60);
  const urlByPath = new Map((signed ?? []).filter((s) => s.path && s.signedUrl).map((s) => [s.path!, s.signedUrl]));
  const out: Record<string, string> = {};
  for (const r of rows) {
    const url = urlByPath.get(r.storage_path);
    if (url) out[r.exercise_id] = url;
  }
  return out;
}
