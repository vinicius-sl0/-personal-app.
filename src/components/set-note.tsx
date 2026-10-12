"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { MessageSquareText } from "lucide-react";

// Ícone discreto ao lado de uma série com a observação do Personal para ELA (workout_exercises.set_notes).
// Tocar abre a observação logo abaixo; tocar de novo, tocar fora ou Esc fecha.
// Quem chama só mostra este componente quando a série tem observação.
export function SetNoteButton({ note, setNumber }: { note: string; setNumber: number }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false); // perto da borda direita: abre para dentro
  const box = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Ao abrir, confere se a janelinha cabe na tela; se não, alinha pela direita do ícone.
  useLayoutEffect(() => {
    if (!open || !box.current) return;
    const iconLeft = box.current.getBoundingClientRect().left;
    const width = panel.current?.offsetWidth ?? 256;
    setAlignRight(iconLeft + width > window.innerWidth - 8);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Observação da série ${setNumber}`}
        title={`Observação da série ${setNumber}`}
        className={`grid size-8 place-items-center rounded-lg transition-colors ${
          open ? "bg-brand-soft text-brand-ink" : "text-brand-ink hover:bg-brand-soft"
        }`}
      >
        <MessageSquareText aria-hidden className="size-4" />
      </button>
      {open && (
        <div
          ref={panel}
          id={panelId}
          role="note"
          className={`absolute ${alignRight ? "right-0" : "left-0"} top-full z-20 mt-1.5 w-64 max-w-[calc(100vw-3rem)] animate-fade-in rounded-xl border border-line-strong bg-card p-3 text-left shadow-[0_12px_32px_-12px_rgb(0_0_0/0.5)]`}
        >
          <p className="text-xs font-semibold text-brand-ink">Série {setNumber}</p>
          <p className="mt-0.5 whitespace-pre-line text-sm leading-snug text-ink">{note}</p>
        </div>
      )}
    </div>
  );
}

// Observação da série `index` (0 = série 1), ou null se não houver.
export function setNoteAt(notes: string[] | null | undefined, index: number): string | null {
  const n = notes?.[index]?.trim();
  return n ? n : null;
}
