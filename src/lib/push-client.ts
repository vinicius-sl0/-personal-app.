// Avisos no celular — parte que roda no NAVEGADOR (inscrever/desinscrever este aparelho).
// A gravação no banco passa pelas Server Actions de lib/push-actions.ts.
import { removePushSubscription } from "@/lib/push-actions";

export type PushSupport = "ok" | "ios-install" | "unsupported";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const nav = navigator as Navigator & { standalone?: boolean };
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  // iPhone/iPad: a Apple só entrega avisos para o app instalado na tela inicial (iOS 16.4+).
  if (ios && !standalone) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return "ok";
}

// O service worker é registrado sozinho só no site publicado; aqui garantimos que ele existe
// (também no computador de desenvolvimento) antes de inscrever.
async function registration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export async function currentSubscription() {
  if (pushSupport() !== "ok") return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

function base64UrlToBytes(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Pede permissão (se ainda não deu) e cria a inscrição. Devolve os dados para gravar no banco.
export async function subscribeThisDevice() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) throw new Error("Os avisos ainda não foram configurados no site.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const reg = await registration();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) }));
  const json = sub.toJSON();
  return { endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth };
}

// Cancela a inscrição deste aparelho no navegador e no banco. Usado ao desativar e ao SAIR da
// conta (para os avisos de uma pessoa não continuarem chegando num celular compartilhado).
export async function unsubscribeThisDevice(): Promise<{ error?: string }> {
  const sub = await currentSubscription().catch(() => null);
  if (!sub) return {};
  const res = await removePushSubscription(sub.endpoint);
  await sub.unsubscribe().catch(() => undefined);
  return res.error ? { error: res.error } : {};
}
