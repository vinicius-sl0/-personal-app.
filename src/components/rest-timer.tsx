"use client";

import { useEffect, useRef, useState } from "react";

// Cronômetro de descanso: conta regressivo a partir de "seconds", com beep e vibração ao zerar.
export default function RestTimer({
  seconds,
  onClose,
}: {
  seconds: number;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      if (!doneRef.current) {
        doneRef.current = true;
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.frequency.value = 880;
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch {
          // navegador sem suporte a áudio: só a vibração/tela já avisam
        }
      }
      return;
    }
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const mm = String(Math.floor(Math.max(left, 0) / 60)).padStart(2, "0");
  const ss = String(Math.max(left, 0) % 60).padStart(2, "0");
  const finished = left <= 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">{finished ? "Descanso terminado" : "Descansando..."}</p>
          <p className={`text-4xl font-bold tabular-nums ${finished ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
            {mm}:{ss}
          </p>
        </div>
        <div className="flex gap-2">
          {!finished && (
            <button
              type="button"
              onClick={() => setLeft((v) => v + 15)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
            >
              +15s
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {finished ? "Continuar" : "Pular"}
          </button>
        </div>
      </div>
    </div>
  );
}
