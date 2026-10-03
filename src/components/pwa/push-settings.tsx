"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Smartphone } from "lucide-react";
import { savePushSubscription, sendTestPush } from "@/lib/push-actions";
import { currentSubscription, pushSupport, subscribeThisDevice, unsubscribeThisDevice, type PushSupport } from "@/lib/push-client";
import { btnGhostCls, btnPrimaryCls, btnSecondaryCls, errorCls } from "@/lib/ui";
import { useToast } from "@/components/ui/toast";

type Status = "loading" | PushSupport | "denied" | "off" | "on";

// Cartão "Avisos no celular" (página de Notificações): ativar/desativar neste aparelho e testar.
export function PushSettings() {
  const toast = useToast();
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const support = pushSupport();
      let next: Status = support;
      if (support === "ok") {
        if (Notification.permission === "denied") next = "denied";
        else next = (await currentSubscription().catch(() => null)) ? "on" : "off";
      }
      if (alive) setStatus(next);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const sub = await subscribeThisDevice();
      if (!sub) {
        setStatus(Notification.permission === "denied" ? "denied" : "off");
        return;
      }
      const res = await savePushSubscription(sub);
      if (res.error) {
        setError(res.error);
        await unsubscribeThisDevice().catch(() => undefined);
        return;
      }
      setStatus("on");
      toast.success("Avisos ativados neste aparelho");
    } catch (err) {
      console.error("push enable:", err);
      setError("Não foi possível ativar: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const res = await unsubscribeThisDevice();
      if (res.error) {
        setError(res.error);
        return;
      }
      setStatus("off");
      toast.success("Avisos desativados neste aparelho");
    } catch (err) {
      setError("Não foi possível desativar: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setError(null);
    try {
      const res = await sendTestPush();
      if (res.error) setError(res.error);
      else toast.success("Aviso de teste enviado. Ele deve chegar em alguns segundos.");
    } catch (err) {
      setError("Falha de conexão: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return null;

  const text: Record<Exclude<Status, "loading">, string> = {
    ok: "",
    off: "Receba no celular os avisos de mensagens, treinos e avaliações, mesmo com o app fechado.",
    on: "Ativados neste aparelho. Você recebe os avisos mesmo com o app fechado.",
    denied:
      "Os avisos estão bloqueados neste aparelho. Para liberar, abra as configurações do navegador (ou do app) em Notificações e permita este site.",
    "ios-install":
      "No iPhone, os avisos só funcionam com o app instalado. Instale pelo menu (Instalar o app), abra pelo ícone na tela inicial e ative por lá.",
    unsupported: "Este navegador não recebe avisos. No celular, use o Chrome (Android) ou o app instalado (iPhone).",
  };

  return (
    <section aria-label="Avisos no celular" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-brand-ink">
          {status === "on" ? <BellRing className="size-5" /> : status === "off" ? <Smartphone className="size-5" /> : <BellOff className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Avisos no celular</h2>
          <p className="mt-0.5 text-sm text-soft">{text[status]}</p>

          {error && (
            <p role="alert" className={`${errorCls} mt-3`}>
              {error}
            </p>
          )}

          {status === "off" && (
            <button type="button" disabled={busy} onClick={enable} className={`${btnPrimaryCls} mt-3 !h-10 !w-auto px-4 text-sm`}>
              {busy ? "Ativando..." : "Ativar avisos"}
            </button>
          )}
          {status === "on" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={test} className={`${btnSecondaryCls} !h-10`}>
                Enviar aviso de teste
              </button>
              <button type="button" disabled={busy} onClick={disable} className={`${btnGhostCls}`}>
                Desativar neste aparelho
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
