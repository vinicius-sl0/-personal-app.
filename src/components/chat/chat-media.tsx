"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2, Pause, Play, X } from "lucide-react";
import { formatDuration } from "@/lib/chat";
import { useSignedUrl } from "@/lib/chat-media";

// Foto dentro da mensagem. Tocar abre em tela cheia.
export function ChatImage({ path, src, alt }: { path?: string | null; src?: string; alt: string }) {
  const signed = useSignedUrl(src ? null : (path ?? null));
  const url = src ?? signed.url;
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (signed.error && !src) {
    return (
      <span className="flex h-40 w-56 flex-col items-center justify-center gap-1 rounded-xl bg-black/10 text-xs opacity-80">
        <ImageOff aria-hidden className="size-5" /> Foto indisponível
      </span>
    );
  }
  if (!url) {
    return (
      <span aria-label="Carregando foto" className="grid h-40 w-56 place-items-center rounded-xl bg-black/10">
        <Loader2 aria-hidden className="size-5 animate-spin opacity-60" />
      </span>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block overflow-hidden rounded-xl" aria-label="Ver foto em tela cheia">
        {/* eslint-disable-next-line @next/next/no-img-element -- link temporário do Storage, sem otimização do Next */}
        <img src={url} alt={alt} className="max-h-72 w-auto max-w-[min(16rem,70vw)] object-cover" />
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && setOpen(false)}
        aria-label="Foto"
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/90"
      >
        {open && (
          <div className="relative grid min-h-dvh w-screen place-items-center p-4" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} className="max-h-[90dvh] max-w-full object-contain" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-black/60 text-white"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}

// Player de áudio da mensagem: play/pausa, barra de progresso (arrastável) e tempo.
export function ChatAudio({
  path,
  src,
  duration,
  mine,
}: {
  path?: string | null;
  src?: string;
  duration: number | null;
  mine: boolean;
}) {
  const signed = useSignedUrl(src ? null : (path ?? null));
  const url = src ?? signed.url;
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [failed, setFailed] = useState(false);
  const total = duration ?? 0;

  async function toggle() {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
      } catch {
        setFailed(true);
      }
    } else a.pause();
  }

  const track = mine ? "accent-[var(--brand-contrast)]" : "accent-[var(--brand)]";

  if ((signed.error && !src) || failed) {
    return (
      <span className="flex min-w-48 flex-col gap-1 text-sm">
        <span>Não foi possível tocar este áudio aqui.</span>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Abrir o arquivo
          </a>
        )}
      </span>
    );
  }

  return (
    <span className="flex min-w-52 items-center gap-2.5">
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? "Pausar áudio" : "Tocar áudio"}
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          mine ? "bg-brand-contrast/15 text-brand-contrast" : "bg-brand text-brand-contrast"
        } disabled:opacity-50`}
      >
        {!url ? <Loader2 aria-hidden className="size-4 animate-spin" /> : playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="ml-0.5 size-4" />}
      </button>
      <span className="flex min-w-0 flex-1 flex-col">
        <input
          type="range"
          min={0}
          max={Math.max(total, 1)}
          step={0.1}
          value={Math.min(current, Math.max(total, 1))}
          onChange={(e) => {
            const t = Number(e.target.value);
            if (audio.current) audio.current.currentTime = t;
            setCurrent(t);
          }}
          aria-label="Posição do áudio"
          className={`h-1.5 w-full cursor-pointer ${track}`}
        />
        <span className={`mt-1 text-[11px] tabular-nums ${mine ? "text-brand-contrast/70" : "text-muted"}`}>
          {formatDuration(playing || current > 0 ? current : total)}
        </span>
      </span>
      {url && (
        <audio
          ref={audio}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setCurrent(0);
          }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
