"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";

// Cronômetro de descanso: conta regressivo a partir de "seconds", com beep e vibração ao zerar.
// A tela de treino recria o componente (key) a cada série, então ele sempre começa do zero.
export default function RestTimer({
  seconds,
  onClose,
}: {
  seconds: number;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const doneRef = useRef(false);

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
  const R = 26;
  const C = 2 * Math.PI * R;
  const frac = total > 0 ? Math.max(left, 0) / total : 0;

  return (
    <div role="timer" aria-live="polite" className="fixed inset-x-0 bottom-24 z-40 px-4 lg:left-64">
      <div className="theme-dark mx-auto flex max-w-md animate-slide-up items-center gap-4 rounded-3xl border border-line-strong bg-card p-4 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)]">
        <div className="relative grid size-16 shrink-0 place-items-center">
          <svg aria-hidden viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="var(--line-strong)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke={finished ? "#10b981" : "var(--brand)"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - frac)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <Timer aria-hidden className={`size-5 ${finished ? "text-emerald-400" : "text-brand-ink"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{finished ? "Descanso terminado!" : "Descansando..."}</p>
          <p className={`text-3xl font-bold tabular-nums ${finished ? "text-emerald-400" : "text-ink"}`}>
            {mm}:{ss}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!finished && (
            <button
              type="button"
              onClick={() => {
                setLeft((v) => v + 15);
                setTotal((t) => t + 15);
              }}
              className="h-11 rounded-xl border border-line-strong px-3 text-sm font-medium text-ink hover:bg-subtle"
            >
              +15s
            </button>
          )}
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-contrast hover:bg-brand-hover">
            {finished ? "Continuar" : "Pular"}
          </button>
        </div>
      </div>
    </div>
  );
}
