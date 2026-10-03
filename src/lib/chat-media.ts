"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CHAT_BUCKET, CHAT_FILE_MAX_BYTES, EXT_BY_MIME } from "@/lib/chat";

// Foto e áudio do chat — parte do NAVEGADOR. O arquivo sobe direto para o bucket privado
// (a regra do Storage só deixa os dois participantes da conversa enviarem/lerem) e depois a
// mensagem é gravada pela Server Action sendMessage, que o banco confere.

// Tipo sem parâmetros ("audio/webm;codecs=opus" → "audio/webm"), como o bucket espera.
export const baseMime = (mime: string) => mime.split(";")[0].trim().toLowerCase();

// Caminho: {conversa}/{id da mensagem}.ext — usar o id da mensagem deixa o reenvio seguro.
export function chatFilePath(conversationId: string, messageId: string, mime: string) {
  const ext = EXT_BY_MIME[baseMime(mime)];
  if (!ext) throw new Error("Tipo de arquivo não aceito no chat.");
  return `${conversationId}/${messageId}.${ext}`;
}

export async function uploadChatFile(path: string, blob: Blob, mime: string) {
  if (blob.size > CHAT_FILE_MAX_BYTES) throw new Error("Arquivo grande demais (máximo 5 MB).");
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(CHAT_BUCKET)
    .upload(path, blob, { contentType: baseMime(mime), upsert: false, cacheControl: "3600" });
  // Reenvio depois de falha de rede: o arquivo já tinha subido — tudo certo.
  if (error && !/exist|duplicate/i.test(error.message)) throw new Error(error.message);
}

// Links temporários (1 hora) para ver/ouvir; guardados para não pedir de novo a cada tela.
const cache = new Map<string, { url: string; expires: number }>();

async function signedUrl(path: string) {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now() + 60_000) return hit.url;
  const { data, error } = await createClient().storage.from(CHAT_BUCKET).createSignedUrl(path, 3600);
  if (error || !data) throw new Error(error?.message ?? "link indisponível");
  cache.set(path, { url: data.signedUrl, expires: Date.now() + 3600_000 });
  return data.signedUrl;
}

export function useSignedUrl(path: string | null) {
  const [state, setState] = useState<{ path: string | null; url: string | null; error: string | null }>({
    path: null,
    url: null,
    error: null,
  });
  useEffect(() => {
    if (!path) return;
    let alive = true;
    signedUrl(path).then(
      (url) => alive && setState({ path, url, error: null }),
      (err: Error) => alive && setState({ path, url: null, error: err.message }),
    );
    return () => {
      alive = false;
    };
  }, [path]);
  // Resultado de outro arquivo (path mudou) ainda não vale para este.
  return state.path === path ? state : { url: null, error: null };
}
