"use client";

import { useEffect } from "react";

// Um único "ouvinte" de mouse para a página inicial: em qualquer elemento com `data-glow`
// (botões principais e cartões), grava a posição do ponteiro em --mx/--my, e o CSS desenha a luz
// nesse ponto. Só em aparelhos com mouse; no toque não faz nada.
export default function PointerGlow() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-glow]") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}
