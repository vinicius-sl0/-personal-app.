// Imagem do exercício (uma por exercício), guardada no bucket PRIVADO "exercise-media".
// Caminho exigido pelas regras do Storage: {owner_id}/{exercise_id}/{arquivo}.
// Na tabela exercise_media: kind "imagem", source "upload", position 1 (o vídeo usa a 0).
export const EXERCISE_MEDIA_BUCKET = "exercise-media";
export const EXERCISE_IMAGE_POSITION = 1;

export function exerciseImagePrefix(ownerId: string, exerciseId: string) {
  return `${ownerId}/${exerciseId}/`;
}
