import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationTitle, type NotificationType } from "@/lib/notifications";

// Envio dos avisos para os celulares (push). Chamado SÓ pela rota /api/push, que o banco aciona
// a cada aviso novo (migração 20261002000001). Usa o cliente admin porque acontece sem ninguém
// logado: lê o aviso, os aparelhos da pessoa e apaga inscrições que o navegador já cancelou.
//
// Privacidade: a notificação aparece na tela bloqueada, então leva só o tipo do aviso e o texto
// curto gravado pelo banco (nome do aluno/da ficha) — nunca o conteúdo de mensagens ou respostas
// de saúde.

export type PushPayload = { title: string; body: string; url: string; tag: string };

function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Chaves dos avisos (VAPID) não configuradas.");
  // "subject" identifica o site para o serviço de avisos (Google/Apple/Mozilla).
  const appUrl = process.env.APP_URL ?? "";
  webpush.setVapidDetails(appUrl.startsWith("https://") ? appUrl : "https://localhost", publicKey, privateKey);
}

const DEFAULT_BODY: Partial<Record<NotificationType, string>> = {
  nova_mensagem: "Toque para abrir a conversa.",
  treino_atribuido: "Toque para ver seu treino.",
  avaliacao_registrada: "Toque para ver sua avaliação.",
  checkin_respondido: "Toque para ver a resposta.",
  checkin_pendente: "Conte como foi sua semana.",
};

type Sub = { id: string; endpoint: string; p256dh: string; auth_key: string };

// Manda o mesmo aviso para vários aparelhos. Devolve quais funcionaram e quais o navegador já
// cancelou (404/410 — app desinstalado, permissão retirada...), para apagar.
export async function sendToSubscriptions(subs: Sub[], payload: PushPayload, urgency: "high" | "normal" = "normal") {
  configure();
  let sent = 0;
  const ok: string[] = [];
  const gone: string[] = [];
  const errors: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency },
        );
        sent++;
        ok.push(s.id);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(s.id);
        else {
          console.error("push:", status, (err as Error).message);
          errors.push(`${status ?? "?"} ${(err as Error).message}`);
        }
      }
    }),
  );
  return { sent, ok, gone, errors };
}

export async function sendPushForNotification(notificationId: string) {
  const admin = createAdminClient();

  const { data: n, error } = await admin
    .from("notifications")
    .select("id, user_id, type, title, body")
    .eq("id", notificationId)
    .maybeSingle();
  if (error) throw new Error("Aviso: " + error.message);
  if (!n) return { sent: 0, removed: 0, skipped: "aviso não encontrado" };

  const [{ data: profile }, { data: subs, error: subsError }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", n.user_id).maybeSingle(),
    admin.from("push_subscriptions").select("id, endpoint, p256dh, auth_key").eq("user_id", n.user_id),
  ]);
  if (subsError) throw new Error("Inscrições: " + subsError.message);
  if (!profile || !subs?.length) return { sent: 0, removed: 0, skipped: "sem aparelho inscrito" };

  const payload: PushPayload = {
    title: notificationTitle(n),
    body: n.body ?? DEFAULT_BODY[n.type] ?? "Toque para abrir.",
    // Abrir pela rota de sempre: marca como lido e leva para a tela certa.
    url: `/${profile.role}/notificacoes/abrir/${n.id}`,
    tag: n.type,
  };

  const { sent, ok, gone } = await sendToSubscriptions(subs, payload, n.type === "nova_mensagem" ? "high" : "normal");
  if (gone.length) await admin.from("push_subscriptions").delete().in("id", gone);
  if (ok.length) await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).in("id", ok);
  return { sent, removed: gone.length };
}
