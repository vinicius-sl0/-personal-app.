"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ExerciseFormState = { error?: string };

const difficultyEnum = z.enum(["iniciante", "intermediario", "avancado"]);
const urlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "O link do vídeo precisa começar com http:// ou https://.");

const schema = z.object({
  name: z.string().trim().min(2, "Informe o nome do exercício.").max(150, "Nome muito longo."),
  primary_muscle_group_id: z.uuid("Escolha o grupo muscular principal."),
  secondary_muscle_group_ids: z.array(z.uuid()).max(10),
  equipment_id: z.uuid("Escolha o equipamento.").or(z.literal("")),
  difficulty: difficultyEnum,
  instructions: z.string().trim().max(2000, "Descrição muito longa."),
  video_url: urlOrEmpty,
  // Gasto calórico médio ESTIMADO por minuto (opcional). Aceita vírgula: "7,5".
  kcal_per_min: z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0 && Number(v) <= 30), {
      message: "Calorias por minuto: informe um número entre 0,1 e 30 (ex.: 7,5) ou deixe em branco.",
    })
    .transform((v) => (v === "" ? null : Number(v))),
});

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

function parseForm(formData: FormData) {
  return schema.safeParse({
    name: str(formData, "name"),
    primary_muscle_group_id: str(formData, "primary_muscle_group_id"),
    secondary_muscle_group_ids: formData.getAll("secondary_muscle_group_ids").map(String),
    equipment_id: str(formData, "equipment_id"),
    difficulty: str(formData, "difficulty") || "iniciante",
    instructions: str(formData, "instructions"),
    video_url: str(formData, "video_url").trim(),
    kcal_per_min: str(formData, "kcal_per_min"),
  });
}

// Grava o link de vídeo em exercise_media (source "youtube" para links do YouTube, "externo" para os demais).
async function saveVideo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exerciseId: string,
  url: string,
) {
  if (!url) return;
  const source = /youtube\.com|youtu\.be/i.test(url) ? "youtube" : "externo";
  await supabase.from("exercise_media").insert({
    exercise_id: exerciseId,
    kind: "video",
    source,
    url,
    position: 0,
  });
}

export async function createExercise(
  _prev: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const profile = await requireRole("personal");
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert({
      owner_id: profile.id,
      name: d.name,
      instructions: d.instructions || null,
      primary_muscle_group_id: d.primary_muscle_group_id,
      equipment_id: d.equipment_id || null,
      difficulty: d.difficulty,
      kcal_per_min: d.kcal_per_min,
    })
    .select("id")
    .single();

  if (error || !exercise) {
    if (error?.code === "23505") return { error: "Já existe um exercício com este nome." };
    console.error("createExercise:", error?.message);
    return { error: "Não foi possível cadastrar o exercício. Tente novamente." };
  }

  if (d.secondary_muscle_group_ids.length > 0) {
    await supabase.from("exercise_muscle_groups").insert(
      d.secondary_muscle_group_ids
        .filter((id) => id !== d.primary_muscle_group_id)
        .map((muscle_group_id) => ({ exercise_id: exercise.id, muscle_group_id })),
    );
  }

  await saveVideo(supabase, exercise.id, d.video_url);

  revalidatePath("/personal/exercicios");
  redirect("/personal/exercicios");
}

export async function updateExercise(
  _prev: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  await requireRole("personal");
  const id = str(formData, "id");
  if (!z.uuid().safeParse(id).success) return { error: "Exercício inválido." };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;

  const supabase = await createClient();

  // A RLS só permite atualizar exercícios do próprio Personal.
  const { error } = await supabase
    .from("exercises")
    .update({
      name: d.name,
      instructions: d.instructions || null,
      primary_muscle_group_id: d.primary_muscle_group_id,
      equipment_id: d.equipment_id || null,
      difficulty: d.difficulty,
      kcal_per_min: d.kcal_per_min,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Já existe um exercício com este nome." };
    console.error("updateExercise:", error.message);
    return { error: "Não foi possível salvar as alterações." };
  }

  await supabase.from("exercise_muscle_groups").delete().eq("exercise_id", id);
  if (d.secondary_muscle_group_ids.length > 0) {
    await supabase.from("exercise_muscle_groups").insert(
      d.secondary_muscle_group_ids
        .filter((mid) => mid !== d.primary_muscle_group_id)
        .map((muscle_group_id) => ({ exercise_id: id, muscle_group_id })),
    );
  }

  // Substitui o vídeo principal (mantém no máximo 1 nesta versão simples).
  await supabase.from("exercise_media").delete().eq("exercise_id", id).eq("position", 0);
  await saveVideo(supabase, id, d.video_url);

  revalidatePath("/personal/exercicios");
  revalidatePath(`/personal/exercicios/${id}`);
  redirect("/personal/exercicios");
}

export async function archiveExercise(formData: FormData) {
  await requireRole("personal");
  const id = str(formData, "id");
  if (!z.uuid().safeParse(id).success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("exercises").update({ is_archived: true }).eq("id", id);
  if (error) console.error("archiveExercise:", error.message);
  revalidatePath("/personal/exercicios");
}

export async function unarchiveExercise(formData: FormData) {
  await requireRole("personal");
  const id = str(formData, "id");
  if (!z.uuid().safeParse(id).success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("exercises").update({ is_archived: false }).eq("id", id);
  if (error) console.error("unarchiveExercise:", error.message);
  revalidatePath("/personal/exercicios");
}

// "Duplicar e personalizar": usado para copiar um exercício e ajustar sem afetar o original
// (hoje todo exercício já é do próprio Personal, mas a ação continua útil para variações,
// ex.: "Agachamento livre" -> "Agachamento livre (minha variação)").
export async function duplicateExercise(formData: FormData) {
  const profile = await requireRole("personal");
  const id = str(formData, "id");
  if (!z.uuid().safeParse(id).success) return;

  const supabase = await createClient();
  const { data: original } = await supabase
    .from("exercises")
    .select("name, instructions, primary_muscle_group_id, equipment_id, difficulty, kcal_per_min")
    .eq("id", id)
    .maybeSingle();
  if (!original) return;

  const { data: created } = await supabase
    .from("exercises")
    .insert({ ...original, owner_id: profile.id, name: `${original.name} (cópia)` })
    .select("id")
    .single();

  const { data: secondary } = await supabase
    .from("exercise_muscle_groups")
    .select("muscle_group_id")
    .eq("exercise_id", id);

  if (created && secondary && secondary.length > 0) {
    await supabase.from("exercise_muscle_groups").insert(
      secondary.map((s) => ({ exercise_id: created.id, muscle_group_id: s.muscle_group_id })),
    );
  }

  revalidatePath("/personal/exercicios");
  if (created) redirect(`/personal/exercicios/${created.id}`);
}
