"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteMessage, fetchMessages, markConversationRead, sendMessage } from "@/lib/chat-actions";
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
}: {
  conversationId: string;
  myId: string;
  otherName: string;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  canPost: boolean;
  cannotPostReason?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState<Pending[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<"conectando" | "ok" | "falhou">("conectando");
  const [selected, setSelected] = useState<string | null>(null);

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
    `max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
      mine
        ? "self-end rounded-br-sm bg-brand text-brand-contrast"
        : "self-start rounded-bl-sm bg-subtle-strong"
    }`;

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-80 flex-col gap-2">
      {live === "falhou" && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <span>Sem atualização automática no momento. Mensagens novas podem demorar a aparecer.</span>
          <button type="button" onClick={resync} className="shrink-0 font-semibold underline">
            Atualizar
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className={`${errorCls} flex items-start justify-between gap-2`}>
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Fechar aviso" className="shrink-0 font-semibold">
            ×
          </button>
        </p>
      )}

      <div
        ref={listRef}
        onScroll={onScroll}
        className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-line p-3 bg-card"
      >
        {hasMore && (
          <button type="button" onClick={loadOlder} disabled={loadingOlder} className={`${btnSecondaryCls} self-center !h-9 text-xs`}>
            {loadingOlder ? "Carregando..." : "Ver mensagens anteriores"}
          </button>
        )}

        {messages.length === 0 && pending.length === 0 && (
          <p className="m-auto text-center text-sm text-muted">
            Nenhuma mensagem ainda. Mande a primeira para {otherName}.
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === myId;
          if (m.deleted_at) {
            return (
              <p key={m.id} className={`${bubble(mine)} italic opacity-60`}>
                Mensagem apagada
              </p>
            );
          }
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <button
                type="button"
                disabled={!mine}
                onClick={() => setSelected((s) => (s === m.id ? null : m.id))}
                className={`${bubble(mine)} text-left disabled:cursor-text`}
              >
                {m.body}
                <span className={`mt-1 block text-[10px] ${mine ? "text-brand-contrast/70" : "text-muted"}`}>
                  {formatMessageTime(m.created_at)}
                </span>
              </button>
              {mine && selected === m.id && (
                <button type="button" onClick={() => handleDelete(m.id)} className="mt-1 text-xs text-red-700 underline dark:text-red-400">
                  Apagar mensagem
                </button>
              )}
            </div>
          );
        })}

        {pending.map((p) => (
          <div key={p.id} className="flex flex-col items-end">
            <p className={`${bubble(true)} opacity-70`}>
              {p.body}
              <span className="mt-1 block text-[10px] text-brand-contrast/70">
                {p.error ? "Não enviada" : "Enviando..."}
              </span>
            </p>
            {p.error && (
              <div className="mt-1 max-w-[80%] space-y-1 text-right text-xs">
                <p className="text-red-700 dark:text-red-400">{p.error}</p>
                <button type="button" onClick={() => deliver(p)} className="font-semibold underline">
                  Tentar de novo
                </button>{" "}
                ·{" "}
                <button
                  type="button"
                  onClick={() => setPending((prev) => prev.filter((x) => x.id !== p.id))}
                  className="underline"
                >
                  Descartar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {canPost ? (
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MESSAGE_MAX_LENGTH}
            rows={1}
            placeholder="Escreva uma mensagem"
            aria-label="Mensagem"
            className={`${inputCls} !h-auto max-h-32 min-h-12 resize-none py-3`}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-12 shrink-0 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-contrast disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      ) : (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-soft dark:bg-zinc-900">
          {cannotPostReason ?? "Não é possível enviar mensagens nesta conversa."}
        </p>
      )}
    </div>
  );
}
