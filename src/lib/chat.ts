import type { Database } from "@/types/database.types";

// Regras e tipos do chat, usados tanto no servidor quanto no navegador.

export type ChatMessage = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "conversation_id" | "sender_id" | "type" | "body" | "attachment_path" | "media_duration_s" | "created_at" | "deleted_at"
>;

export const MESSAGE_COLUMNS =
  "id, conversation_id, sender_id, type, body, attachment_path, media_duration_s, created_at, deleted_at";
export const MESSAGE_MAX_LENGTH = 4000;
export const MESSAGES_PAGE = 50;

// Foto e áudio (bucket privado chat-attachments, pasta da conversa; migração 20261003000001).
export const CHAT_BUCKET = "chat-attachments";
export const AUDIO_MAX_SECONDS = 180;
export const CHAT_IMAGE_MAX_SIDE = 1600;
export const CHAT_FILE_MAX_BYTES = 5 * 1024 * 1024;

// Extensão do arquivo pelo tipo (o banco confere a extensão).
export const EXT_BY_MIME: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
};

export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Texto curto da mensagem para listas (conversas, início): nunca mostra o arquivo em si.
export function messagePreview(m: Pick<ChatMessage, "type" | "body" | "deleted_at" | "media_duration_s">) {
  if (m.deleted_at) return "Mensagem apagada";
  if (m.type === "imagem") return m.body ? `Foto: ${m.body}` : "Foto";
  if (m.type === "audio") return m.media_duration_s ? `Áudio (${formatDuration(m.media_duration_s)})` : "Áudio";
  return m.body ?? "";
}

// Fuso fixo: o servidor (Vercel) roda em UTC; assim servidor e navegador mostram a mesma hora.
const TZ = "America/Sao_Paulo";

export function formatMessageTime(iso: string) {
  const d = new Date(iso);
  const day = (x: Date) => x.toLocaleDateString("pt-BR", { timeZone: TZ });
  return day(d) === day(new Date())
    ? d.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
