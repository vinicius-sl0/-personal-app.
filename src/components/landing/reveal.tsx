"use client";

import { useEffect, useRef, useState } from "react";

// Entrada suave de um bloco da página inicial quando ele chega na tela.
// Seguro por padrão: o servidor manda o conteúdo VISÍVEL; só depois de carregar, e só para
// blocos ainda fora da tela, ele é escondido e aparece ao rolar. Sem JavaScript ou com
// "reduzir movimento" ligado no aparelho, nada é animado.
export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms, para escalonar itens de uma lista
  as?: "div" | "li" | "section";
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
      ? "translate-y-6 opacity-0"
      : state === "shown"
        ? "translate-y-0 opacity-100 transition-[opacity,transform] duration-700 ease-out"
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
