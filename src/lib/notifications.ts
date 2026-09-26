import type { Database, Json } from "@/types/database.types";
import type { Role } from "@/lib/auth";

// Rótulos e destino de cada aviso, usados no servidor e no navegador.
// Os títulos gravados pelo banco (triggers) são antigos/sem acento; a tela usa estes.

export type NotificationType = Database["public"]["Enums"]["notification_type"];

export type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Json;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

export const NOTIFICATION_COLUMNS = "id, type, title, body, data, url, read_at, created_at";

const LABELS: Partial<Record<NotificationType, { icon: string; title: string }>> = {
  nova_mensagem: { icon: "💬", title: "Nova mensagem" },
  treino_atribuido: { icon: "🏋️", title: "Novo treino disponível" },
  avaliacao_registrada: { icon: "📏", title: "Nova avaliação registrada" },
  checkin_recebido: { icon: "📝", title: "Novo feedback semanal" },
  checkin_respondido: { icon: "✅", title: "Seu Personal respondeu seu feedback" },
  checkin_pendente: { icon: "📝", title: "Feedback semanal pendente" },
};

export function notificationIcon(n: Pick<NotificationRow, "type">) {
  return LABELS[n.type]?.icon ?? "🔔";
}

export function notificationTitle(n: Pick<NotificationRow, "type" | "title">) {
  return LABELS[n.type]?.title ?? n.title;
}

function dataField(data: Json, key: string): string | null {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const v = (data as Record<string, Json | undefined>)[key];
    return typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null;
  }
  return null;
}

// Para onde o aviso leva. `studentIdOfConversation` só é usado pelo Personal (aviso de mensagem).
export function notificationDestination(
  n: Pick<NotificationRow, "type" | "data" | "url">,
  role: Role,
  studentIdOfConversation?: string | null,
): string {
  // url gravada pelo banco: só caminhos internos (evita redirecionar para outro site)
  if (n.url && n.url.startsWith("/") && !n.url.startsWith("//")) return n.url;

  const home = role === "personal" ? "/personal" : "/aluno";
  const studentId = dataField(n.data, "student_id");

  if (role === "personal") {
    switch (n.type) {
      case "nova_mensagem":
        return studentIdOfConversation ? `/personal/alunos/${studentIdOfConversation}/mensagens` : "/personal/mensagens";
      case "checkin_recebido": {
        const checkinId = dataField(n.data, "checkin_id");
        if (!studentId) return "/personal/feedback";
        return `/personal/alunos/${studentId}/feedback${checkinId ? `#${checkinId}` : ""}`;
      }
      default:
        return studentId ? `/personal/alunos/${studentId}` : home;
    }
  }

  switch (n.type) {
    case "nova_mensagem":
      return "/aluno/mensagens";
    case "treino_atribuido":
      return "/aluno/treinos";
    case "avaliacao_registrada": {
      const assessmentId = dataField(n.data, "assessment_id");
      return assessmentId ? `/aluno/avaliacoes/${assessmentId}` : "/aluno/avaliacoes";
    }
    case "checkin_respondido":
    case "checkin_pendente":
      return "/aluno/feedback";
    default:
      return home;
  }
}

export function conversationIdOf(n: Pick<NotificationRow, "data">) {
  return dataField(n.data, "conversation_id");
}
