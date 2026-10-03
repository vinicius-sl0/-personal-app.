"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_MAX_SECONDS } from "@/lib/chat";

export type Recording = { blob: Blob; mime: string; seconds: number };

// Formatos em ordem de preferência. Chrome/Android/Edge gravam WebM (Opus); iPhone grava MP4 (AAC).
const CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

export function recordingSupported() {
  return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

// Gravação de áudio do chat: start → (stop | cancel). Para sozinha em AUDIO_MAX_SECONDS.
export function useAudioRecorder(onDone: (rec: Recording) => void) {
  const [state, setState] = useState<"idle" | "starting" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const discard = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  const release = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop()); // apaga a luz do microfone
    stream.current = null;
    recorder.current = null;
  }, []);

  useEffect(() => release, [release]);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const cancel = useCallback(() => {
    discard.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    setError(null);
    if (!recordingSupported()) {
      setError("Este navegador não grava áudio. Atualize o navegador ou use o app instalado.");
      return;
    }
    setState("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      setState("idle");
      const name = (err as DOMException).name;
      setError(
        name === "NotAllowedError"
          ? "O microfone está bloqueado. Libere o acesso ao microfone para este site nas configurações do navegador."
          : name === "NotFoundError"
            ? "Nenhum microfone encontrado neste aparelho."
            : "Não foi possível usar o microfone: " + (err as Error).message,
      );
      return;
    }

    const mime = pickMime() ?? "";
    const rec = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    recorder.current = rec;
    chunks.current = [];
    discard.current = false;
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
    rec.onstop = () => {
      const secs = Math.round((Date.now() - startedAt.current) / 1000);
      const type = rec.mimeType || mime || "audio/webm";
      const blob = new Blob(chunks.current, { type });
      release();
      setState("idle");
      setSeconds(0);
      if (discard.current) return;
      if (secs < 1 || blob.size === 0) {
        setError("Áudio muito curto. Toque no microfone, fale e depois toque em enviar.");
        return;
      }
      doneRef.current({ blob, mime: type, seconds: Math.min(secs, AUDIO_MAX_SECONDS) });
    };
    rec.start(1000);
    startedAt.current = Date.now();
    setSeconds(0);
    setState("recording");
    timer.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(s);
      if (s >= AUDIO_MAX_SECONDS) stop();
    }, 250);
  }, [release, stop]);

  return { state, seconds, error, clearError: () => setError(null), start, stop, cancel };
}
