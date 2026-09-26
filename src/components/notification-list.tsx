"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteReadNotifications, markAllNotificationsRead } from "@/lib/notification-actions";
import { notificationIcon, notificationTitle } from "@/lib/notifications";
import { formatMessageTime } from "@/lib/chat";
import type { NotificationView } from "@/lib/notification-data";
import { btnSecondaryCls, errorCls } from "@/lib/ui";

export default function NotificationList({ items, openBase }: { items: NotificationView[]; openBase: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"lidas" | "apagar" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unread = items.filter((n) => !n.read_at).length;
  const read = items.length - unread;

  async function run(kind: "lidas" | "apagar") {
    if (kind === "apagar" && !confirm(`Apagar ${read === 1 ? "o aviso já lido" : `os ${read} avisos já lidos`}?`)) return;
    setBusy(kind);
    setError(null);
    try {
      const res = kind === "lidas" ? await markAllNotificationsRead() : await deleteReadNotifications();
      if (res.error) setError(res.error);
      else router.refresh();
    } catch (err) {
      console.error("notificações:", err);
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="flex gap-2">
          <button type="button" onClick={() => run("lidas")} disabled={busy !== null || unread === 0} className={`${btnSecondaryCls} flex-1`}>
            {busy === "lidas" ? "Salvando..." : "Marcar todas como lidas"}
          </button>
          <button type="button" onClick={() => run("apagar")} disabled={busy !== null || read === 0} className={`${btnSecondaryCls} flex-1`}>
            {busy === "apagar" ? "Apagando..." : "Apagar as lidas"}
          </button>
        </div>
      )}
      {error && <p role="alert" className={errorCls}>{error}</p>}

      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          Nenhum aviso por aqui.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            {/* <a> e não <Link>: abrir marca como lido, então não pode ser pré-carregado. */}
            <a
              href={`${openBase}/${n.id}`}
              className={`flex items-start gap-3 rounded-xl border p-3 hover:bg-subtle ${
                n.read_at
                  ? "border-line"
                  : "border-line-strong bg-zinc-50 dark:bg-zinc-900/60"
              }`}
            >
              <span aria-hidden className="text-xl leading-6">
                {notificationIcon(n)}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block ${n.read_at ? "font-medium" : "font-bold"}`}>{notificationTitle(n)}</span>
                {n.detail && <span className="block truncate text-sm text-muted">{n.detail}</span>}
                <span className="block text-xs text-zinc-400">{formatMessageTime(n.created_at)}</span>
              </span>
              {!n.read_at && <span aria-label="(não lido)" className="mt-2 size-2.5 shrink-0 rounded-full bg-red-600" />}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
