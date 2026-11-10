"use client";

import { useEffect, useRef, useState } from "react";

// Entrada suave de um bloco da página inicial quando ele chega na tela.
// Seguro por padrão: o servidor manda o conteúdo VISÍVEL; só depois de carregar, e só para
// blocos ainda fora da tela, ele é escondido e aparece ao rolar. Sem JavaScript ou com
// "reduzir movimento" ligado no aparelho, nada é animado.
//
// `from` escolhe de onde o bloco vem: de baixo (padrão), da esquerda, da direita, crescendo ou
// só aparecendo. `delay` escalona itens de uma lista.
const HIDDEN = {
  up: "translate-y-8 opacity-0",
  left: "-translate-x-10 opacity-0",
  right: "translate-x-10 opacity-0",
  scale: "scale-95 opacity-0",
  fade: "opacity-0",
} as const;

export default function Reveal({
  children,
  className = "",
  delay = 0,
  from = "up",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  from?: keyof typeof HIDDEN;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    // Já está na tela ao carregar? Fica como está (sem piscar).
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const motion =
    state === "hidden"
      ? HIDDEN[from]
      : state === "shown"
        ? "translate-x-0 translate-y-0 scale-100 opacity-100 transition-[opacity,translate,scale] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        : "";

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`${motion} ${className}`}
      style={state === "shown" && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
