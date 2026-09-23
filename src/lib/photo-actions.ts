"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { recordConsents } from "@/lib/consents";
import { todayIso } from "@/lib/assessment";
import { PHOTO_ANGLES, PHOTO_BUCKET, photoPathPrefix } from "@/lib/photos";

export type PhotoActionState = { error?: string; ok?: boolean };

function revalidatePhotos(studentId: string) {
  revalidatePath("/aluno/fotos");
  revalidatePath(`/personal/alunos/${studentId}/fotos`);
}

const angleValues = PHOTO_ANGLES.map((a) => a.value) as [string, ...string[]];

const photoSetSchema = z
  .object({
    set_id: z.uuid(),
    student_id: z.uuid(),
    taken_at: z.iso.date("Data inválida."),
    notes: z.string().trim().max(500, "A observação pode ter no máximo 500 caracteres.").nullable(),
    photos: z
      .array(
        z.object({
          angle: z.enum(angleValues),
          storage_path: z.string().min(1).max(300),
          width: z.number().int().positive().max(10000),
          height: z.number().int().positive().max(10000),
          size_bytes: z.number().int().positive().max(5 * 1024 * 1024),
          mime_type: z.enum(["image/webp", "image/jpeg"]),
        }),
      )
      .min(1, "Escolha pelo menos uma foto.")
      .max(PHOTO_ANGLES.length),
  })
  .refine((d) => new Set(d.photos.map((p) => p.angle)).size === d.photos.length, {
    message: "Há duas fotos no mesmo ângulo.",
  })
  .refine(
    (d) => d.photos.every((p) => p.storage_path.startsWith(photoPathPrefix(d.student_id, d.set_id))),
    { message: "Caminho de arquivo inválido." },
  );

// Registra no banco um conjunto de fotos cujos arquivos o navegador JÁ enviou ao Storage.
// Vale para o aluno e para o Personal; a RLS exige a autorização "fotos_evolucao" ativa.
export async function savePhotoSet(input: unknown): Promise<PhotoActionState> {
  const { profile } = await getSession();
  if (!profile) return { error: "Sua sessão expirou. Entre novamente." };

  const parsed = photoSetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;
  if (d.taken_at > todayIso()) return { error: "A data das fotos não pode estar no futuro." };
  if (d.taken_at < "1990-01-01") return { error: "Confira a data das fotos." };

  const supabase = await createClient();

  const { error: setError } = await supabase.from("progress_photo_sets").insert({
    id: d.set_id,
    student_id: d.student_id,
    taken_at: d.taken_at,
    notes: d.notes || null,
    created_by: profile.id,
  });
  if (setError) return { error: "Não foi possível salvar as fotos: " + setError.message };

  const { error: photosError } = await supabase.from("progress_photos").insert(
    d.photos.map((p) => ({
      set_id: d.set_id,
      student_id: d.student_id,
      angle: p.angle as (typeof PHOTO_ANGLES)[number]["value"],
      storage_path: p.storage_path,
      width: p.width,
      height: p.height,
      size_bytes: p.size_bytes,
      mime_type: p.mime_type,
    })),
  );
  if (photosError) {
    // Desfaz o conjunto vazio (só o aluno tem permissão; para o Personal fica registrado no log).
    const { error: undoError } = await supabase.from("progress_photo_sets").delete().eq("id", d.set_id);
    if (undoError) console.error("savePhotoSet: conjunto vazio não removido:", undoError.message);
    return { error: "Não foi possível salvar as fotos: " + photosError.message };
  }

  revalidatePhotos(d.student_id);
  return { ok: true };
}

// Exclui um conjunto de fotos (arquivos + registros). Só o próprio aluno pode.
export async function deletePhotoSet(setId: string): Promise<PhotoActionState> {
  await requireRole("aluno");
  if (!z.uuid().safeParse(setId).success) return { error: "Fotos não encontradas." };

  const supabase = await createClient();
  const { data: set, error } = await supabase
    .from("progress_photo_sets")
    .select("id, student_id, progress_photos(storage_path)")
    .eq("id", setId)
    .maybeSingle();
  if (error) return { error: "Não foi possível excluir: " + error.message };
  if (!set) return { error: "Fotos não encontradas." };

  // Primeiro os arquivos: se falhar, nada é apagado do banco e a pessoa pode tentar de novo.
  const paths = set.progress_photos.map((p) => p.storage_path);
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    if (storageError) return { error: "Não foi possível apagar os arquivos: " + storageError.message };
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("progress_photo_sets")
    .delete()
    .eq("id", setId)
    .select("id");
  if (deleteError) return { error: "Não foi possível excluir: " + deleteError.message };
  if (!deleted?.length) return { error: "Você não tem permissão para excluir estas fotos." };

  revalidatePhotos(set.student_id);
  return { ok: true };
}

// O aluno dá ou retira a autorização de fotos de evolução.
export async function setPhotoConsent(
  _prev: PhotoActionState,
  formData: FormData,
): Promise<PhotoActionState> {
  const profile = await requireRole("aluno");
  const grant = formData.get("grant") === "1";

  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id").maybeSingle();
  if (!student) return { error: "Cadastro de aluno não encontrado." };

  const { data: active, error: readError } = await supabase
    .from("consents")
    .select("id")
    .eq("student_id", student.id)
    .eq("type", "fotos_evolucao")
    .is("revoked_at", null);
  if (readError) return { error: "Não foi possível verificar a autorização: " + readError.message };

  if (grant) {
    if (active.length === 0) {
      const res = await recordConsents(supabase, profile.id, student.id, ["fotos_evolucao"]);
      if (!res.ok) return { error: "Não foi possível registrar a autorização. Tente novamente." };
    }
  } else if (active.length > 0) {
    // O banco grava a data/hora real da revogação (trigger consents_guard).
    const { data: revoked, error } = await supabase
      .from("consents")
      .update({ revoked_at: new Date().toISOString() })
      .in(
        "id",
        active.map((c) => c.id),
      )
      .select("id");
    if (error) return { error: "Não foi possível retirar a autorização: " + error.message };
    if (!revoked?.length) return { error: "Não foi possível retirar a autorização. Tente novamente." };
  }

  revalidatePhotos(student.id);
  return { ok: true };
}
