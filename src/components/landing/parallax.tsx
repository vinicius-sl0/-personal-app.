"use client";

import { useEffect, useRef } from "react";

// Profundidade ao rolar: o conteúdo se move um pouco mais devagar (ou mais rápido) que a página.
// Só em telas largas e sem "reduzir movimento" — no celular fica parado (economiza bateria).
// `speed` positivo = fica para trás ao rolar; negativo = adianta. Valores pequenos (0,05 a 0,15).
export default function Parallax({
  children,
  speed = 0.08,
  className = "",
  minWidth = 1024,
  maxShift = 48,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  minWidth?: number;
  maxShift?: number; // px, deslocamento máximo para cima ou para baixo
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = outer.current;
    const el = inner.current;
    if (!box || !el) return;
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let on = false;

    // Mede o invólucro (que não se move) e desloca só o miolo: sem efeito sanfona.
    const update = () => {
      raf = 0;
      const r = box.getBoundingClientRect();
      const offset = r.top + r.height / 2 - window.innerHeight / 2;
      // Limite de deslocamento: longe da tela o efeito não acumula (nunca "sai do lugar").
      const shift = Math.max(-maxShift, Math.min(maxShift, offset * speed));
      el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const sync = () => {
      const should = wide.matches && !reduce.matches;
      if (should && !on) {
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        on = true;
        update();
      } else if (!should && on) {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        on = false;
        el.style.transform = "";
      }
    };
    sync();
    wide.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed, minWidth, maxShift]);

  return (
    <div ref={outer} className={className}>
      <div ref={inner} className="size-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
