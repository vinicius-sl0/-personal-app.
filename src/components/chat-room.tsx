"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteMessage, fetchMessages, fetchOtherLastRead, markConversationRead, sendMessage } from "@/lib/chat-actions";
import { Check, CheckCheck, Loader2, SendHorizontal } from "lucide-react";
import { formatMessageTime, MESSAGE_MAX_LENGTH, type ChatMessage } from "@/lib/chat";
import { btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";

// Mensagem ainda não confirmada pelo banco: aparece como "Enviando..." ou com erro.
type Pending = { id: string; body: string; created_at: string; error: string | null };

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export default function ChatRoom({
  conversationId,
  myId,
  otherName,
  initialMessages,
  initialHasMore,
  canPost,
  cannotPostReason,
  otherLastReadAt = null,
}: {
  conversationId: string;
  myId: string;
  otherName: string;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  canPost: boolean;
  cannotPostReason?: string;
  otherLastReadAt?: string | null; // até onde o outro participante leu (status "Lida")
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState<Pending[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<"conectando" | "ok" | "falhou">("conectando");
  const [selected, setSelected] = useState<string | null>(null);
  const [otherRead, setOtherRead] = useState<string | null>(otherLastReadAt);
  // "Hoje"/"Ontem" dos separadores de dia (calculado uma vez, ao abrir a conversa).
  const [days] = useState(() => {
    const fmt = (t: number) => new Date(t).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const now = Date.now();
    return { today: fmt(now), yesterday: fmt(now - 86400000) };
  });

  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const markRead = useCallback(() => {
    markConversationRead(conversationId).then(
      (res) => res.error && console.error("markConversationRead:", res.error),
      (err) => console.error("markConversationRead:", err),
    );
  }, [conversationId]);

  // Busca as últimas mensagens e junta com as que já estão na tela (cobre o tempo sem conexão).
  const resync = useCallback(async () => {
    try {
      const res = await fetchMessages(conversationId);
      if (res.error) {
        setError("Não foi possível atualizar as mensagens: " + res.error);
        return;
      }
      setMessages((prev) => mergeMessages(prev, res.messages));
      markRead();
      const read = await fetchOtherLastRead(conversationId);
      if (!read.error) setOtherRead(read.lastRead);
    } catch (err) {
      console.error("resync:", err);
      setError("Falha de conexão ao atualizar as mensagens.");
    }
  }, [conversationId, markRead]);

  // Tempo real: mensagens novas e mensagens apagadas chegam sem recarregar a página.
  useEffect(() => {
    const supabase = createClient();
    let firstConnect = true;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const m = payload.new as ChatMessage;
          setMessages((prev) => mergeMessages(prev, [m]));
          setPending((prev) => prev.filter((p) => p.id !== m.id));
          if (payload.eventType === "INSERT" && m.sender_id !== myId) markRead();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_reads", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const r = payload.new as { user_id?: string; last_read_at?: string };
          if (r?.user_id && r.user_id !== myId && r.last_read_at) setOtherRead(r.last_read_at);
        },
      );

    (async () => {
      // Garante que o canal use o login atual (a RLS do banco vale também para o tempo real).
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setLive("ok");
          if (!firstConnect) resync(); // reconectou: busca o que chegou enquanto estava fora
          firstConnect = false;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLive("falhou");
        }
      });
    })();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, myId, markRead, resync]);

  // Ao abrir: marca como lida e atualiza o menu (a bolinha de "nova mensagem" some).
  // Ao voltar para a aba/app: busca novidades.
  useEffect(() => {
    markConversationRead(conversationId).then(
      (res) => (res.error ? console.error("markConversationRead:", res.error) : router.refresh()),
      (err) => console.error("markConversationRead:", err),
    );
  }, [conversationId, router]);

  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && resync();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [resync]);

  // Rola para o fim quando chega mensagem, se a pessoa já estava no fim.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  function onScroll() {
    const el = listRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function loadOlder() {
    const oldest = messages[0];
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      const res = await fetchMessages(conversationId, oldest.created_at);
      if (res.error) {
        setError("Não foi possível carregar as mensagens anteriores: " + res.error);
        return;
      }
      const el = listRef.current;
      const prevHeight = el?.scrollHeight ?? 0;
      stickToBottom.current = false;
      setMessages((prev) => mergeMessages(prev, res.messages));
      setHasMore(res.hasMore);
      // mantém a posição de leitura depois de inserir mensagens acima
      requestAnimationFrame(() => {
        if (el) el.scrollTop += el.scrollHeight - prevHeight;
      });
    } catch (err) {
      console.error("loadOlder:", err);
      setError("Falha de conexão ao carregar as mensagens anteriores.");
    } finally {
      setLoadingOlder(false);
    }
  }

  async function deliver(p: Pending) {
    setPending((prev) => prev.map((x) => (x.id === p.id ? { ...x, error: null } : x)));
    try {
      const res = await sendMessage({ id: p.id, conversation_id: conversationId, body: p.body });
      if (res.error || !res.message) {
        const msg = res.error ?? "Não foi possível enviar a mensagem.";
        setPending((prev) => prev.map((x) => (x.id === p.id ? { ...x, error: msg } : x)));
        return;
      }
      const sent = res.message;
      setMessages((prev) => mergeMessages(prev, [sent]));
      setPending((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      console.error("sendMessage:", err);
      setPending((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, error: "Falha de conexão. A mensagem não foi enviada." } : x)),
      );
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const p: Pending = { id: crypto.randomUUID(), body, created_at: new Date().toISOString(), error: null };
    setPending((prev) => [...prev, p]);
    setDraft("");
    stickToBottom.current = true;
    deliver(p);
  }

  async function handleDelete(id: string) {
    if (!confirm("Apagar esta mensagem para os dois? Isso não pode ser desfeito.")) return;
    setSelected(null);
    try {
      const res = await deleteMessage(id);
      if (res.error || !res.message) {
        setError(res.error ?? "Não foi possível apagar a mensagem.");
        return;
      }
      const deleted = res.message;
      setMessages((prev) => mergeMessages(prev, [deleted]));
    } catch (err) {
      console.error("deleteMessage:", err);
      setError("Falha de conexão ao apagar a mensagem.");
    }
  }

  const bubble = (mine: boolean) =>
    `max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${
      mine ? "self-end rounded-br-md bg-brand text-brand-contrast" : "self-start rounded-bl-md border border-line bg-subtle-strong text-ink"
    }`;

  const readMs = otherRead ? new Date(otherRead).getTime() : 0;
  const dayLabel = (iso: string) => {
    const d = new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    return d === days.today ? "Hoje" : d === days.yesterday ? "Ontem" : d;
  };

  return (
    <div className="flex h-[calc(100dvh-15rem)] min-h-96 flex-col overflow-hidden rounded-2xl border border-line bg-card lg:h-[calc(100dvh-16rem)]">
      {live === "falhou" && (
        <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
          <span>Sem atualização automática no momento. Mensagens novas podem demorar a aparecer.</span>
          <button type="button" onClick={resync} className="shrink-0 font-semibold underline">
            Atualizar
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className={`${errorCls} m-3 flex items-start justify-between gap-2`}>
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Fechar aviso" className="shrink-0 font-semibold">
            ×
          </button>
        </p>
      )}

      <div ref={listRef} onScroll={onScroll} className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
        {hasMore && (
          <button type="button" onClick={loadOlder} disabled={loadingOlder} className={`${btnSecondaryCls} mb-2 self-center !h-9 text-xs`}>
            {loadingOlder ? "Carregando..." : "Ver mensagens anteriores"}
          </button>
        )}

        {messages.length === 0 && pending.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-muted">Nenhuma mensagem ainda. Mande a primeira para {otherName}.</p>
        )}

        {messages.map((m, i) => {
          const mine = m.sender_id === myId;
          const showDay = i === 0 || dayLabel(messages[i - 1].created_at) !== dayLabel(m.created_at);
          const read = mine && readMs >= new Date(m.created_at).getTime();
          return (
            <div key={m.id} className="flex flex-col">
              {showDay && (
                <p className="my-3 self-center rounded-full bg-subtle px-3 py-1 text-[11px] font-medium text-muted">{dayLabel(m.created_at)}</p>
              )}
              {m.deleted_at ? (
                <p className={`${bubble(mine)} italic opacity-60`}>Mensagem apagada</p>
              ) : (
                <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <button
                    type="button"
                    disabled={!mine}
                    onClick={() => setSelected((s) => (s === m.id ? null : m.id))}
                    className={`${bubble(mine)} text-left disabled:cursor-text`}
                  >
                    {m.body}
                    <span className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-brand-contrast/70" : "text-muted"}`}>
                      {formatMessageTime(m.created_at)}
                      {mine &&
                        (read ? (
                          <>
                            <CheckCheck aria-hidden className="size-3.5" />
                            <span className="sr-only">Lida</span>
                          </>
                        ) : (
                          <>
                            <Check aria-hidden className="size-3.5" />
                            <span className="sr-only">Enviada</span>
                          </>
                        ))}
                    </span>
                  </button>
                  {mine && selected === m.id && (
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="text-muted">{read ? "Lida" : "Enviada — ainda não lida"}</span>
                      <button type="button" onClick={() => handleDelete(m.id)} className="font-medium text-red-600 underline dark:text-red-400">
                        Apagar mensagem
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {pending.map((p) => (
          <div key={p.id} className="flex flex-col items-end">
            <p className={`${bubble(true)} opacity-70`}>
              {p.body}
              <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-brand-contrast/70">
                {p.error ? "Não enviada" : (
                  <>
                    <Loader2 aria-hidden className="size-3 animate-spin" /> Enviando...
                  </>
                )}
              </span>
            </p>
            {p.error && (
              <div className="mt-1 max-w-[82%] space-y-1 text-right text-xs">
                <p className="text-red-700 dark:text-red-400">{p.error}</p>
                <button type="button" onClick={() => deliver(p)} className="font-semibold underline">
                  Tentar de novo
                </button>{" "}
                ·{" "}
                <button type="button" onClick={() => setPending((prev) => prev.filter((x) => x.id !== p.id))} className="underline">
                  Descartar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {canPost ? (
        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-line bg-surface/60 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Computador: Enter envia, Shift+Enter quebra linha.
              if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={MESSAGE_MAX_LENGTH}
            rows={1}
            placeholder="Escreva uma mensagem"
            aria-label="Mensagem"
            className={`${inputCls} !h-auto max-h-32 min-h-12 resize-none rounded-2xl py-3`}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Enviar"
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-brand-contrast transition hover:bg-brand-hover active:scale-95 disabled:opacity-40"
          >
            <SendHorizontal aria-hidden className="size-5" />
          </button>
        </form>
      ) : (
        <p className="border-t border-line bg-subtle px-4 py-3 text-sm text-soft">{cannotPostReason ?? "Não é possível enviar mensagens nesta conversa."}</p>
      )}
    </div>
  );
}
