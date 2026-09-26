"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Contadores de avisos não lidos, atualizados em tempo real (Supabase Realtime).
// Um único canal por página alimenta o sino e a bolinha de "Mensagens".

type Counts = { total: number; messages: number };
const CountsContext = createContext<Counts>({ total: 0, messages: 0 });

export function NotificationCountsProvider({
  userId,
  initial,
  children,
}: {
  userId: string;
  initial: Counts;
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState(initial);

  // Recebe valores novos do servidor (ex.: depois de marcar tudo como lido).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial.total !== initial.total || prevInitial.messages !== initial.messages) {
    setPrevInitial(initial);
    setCounts(initial);
  }

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const base = () =>
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
    const [all, msgs] = await Promise.all([base(), base().eq("type", "nova_mensagem")]);
    if (all.error || msgs.error) {
      console.error("contagem de avisos:", (all.error ?? msgs.error)?.message);
      return;
    }
    setCounts({ total: all.count ?? 0, messages: msgs.count ?? 0 });
  }, [userId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`notificacoes:${userId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => {
        refresh();
      },
    );

    (async () => {
      // Garante que o canal use o login atual (a RLS vale também para o tempo real).
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") refresh(); // cobre o que chegou enquanto conectava
      });
    })();

    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return <CountsContext.Provider value={counts}>{children}</CountsContext.Provider>;
}

export function NotificationBell({ href }: { href: string }) {
  const { total } = useContext(CountsContext);
  const label = total === 0 ? "Notificações" : `Notificações: ${total} não ${total === 1 ? "lida" : "lidas"}`;
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {total > 0 && (
        <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-[11px] font-bold leading-5 text-white">
          {total > 99 ? "99+" : total}
        </span>
      )}
    </Link>
  );
}

export function MessagesDot() {
  const { messages } = useContext(CountsContext);
  if (messages === 0) return null;
  return <span aria-label="(nova mensagem)" className="ml-1 inline-block size-2 rounded-full bg-emerald-600 align-middle" />;
}
