import type { Database } from "@/types/database.types";

// Regras e tipos do chat, usados tanto no servidor quanto no navegador.

export type ChatMessage = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "conversation_id" | "sender_id" | "type" | "body" | "created_at" | "deleted_at"
>;

export const MESSAGE_COLUMNS = "id, conversation_id, sender_id, type, body, created_at, deleted_at";
export const MESSAGE_MAX_LENGTH = 4000;
export const MESSAGES_PAGE = 50;

// Fuso fixo: o servidor (Vercel) roda em UTC; assim servidor e navegador mostram a mesma hora.
const TZ = "America/Sao_Paulo";

export function formatMessageTime(iso: string) {
  const d = new Date(iso);
  const day = (x: Date) => x.toLocaleDateString("pt-BR", { timeZone: TZ });
  return day(d) === day(new Date())
    ? d.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
