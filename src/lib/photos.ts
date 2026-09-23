import type { Database } from "@/types/database.types";

export type PhotoAngle = Database["public"]["Enums"]["photo_angle"];

export const PHOTO_BUCKET = "progress-photos";

// Ângulos oferecidos no envio, na ordem em que aparecem na tela.
export const PHOTO_ANGLES: { value: Exclude<PhotoAngle, "outro">; label: string }[] = [
  { value: "frente", label: "Frente" },
  { value: "costas", label: "Costas" },
  { value: "lado_esquerdo", label: "Lado esquerdo" },
  { value: "lado_direito", label: "Lado direito" },
];

export const ANGLE_LABEL: Record<PhotoAngle, string> = {
  frente: "Frente",
  costas: "Costas",
  lado_esquerdo: "Lado esquerdo",
  lado_direito: "Lado direito",
  outro: "Outra",
};

// Formato usado pela tela (URL assinada já gerada no servidor, válida por 1 hora).
export type PhotoView = { id: string; angle: PhotoAngle; url: string | null };
export type PhotoSetView = { id: string; taken_at: string; notes: string | null; photos: PhotoView[] };

// Convenção de caminho exigida pelas regras do Storage: {student_id}/{set_id}/{arquivo}
export function photoPathPrefix(studentId: string, setId: string) {
  return `${studentId}/${setId}/`;
}
