"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import LpButton from "@/components/landing/lp-button";

// Topo da página inicial (só da landing). Transparente sobre a foto do topo; ganha fundo ao rolar.
// No celular, o menu abre num painel com as seções, "Quero ser aluno" e "Entrar".
export default function LandingHeader({ nav, brand }: { nav: { href: string; label: string }[]; brand: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`theme-dark sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solid ? "border-b border-line bg-surface/85 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${brand}, início`}>
          <Image src="/landing/monograma.webp" alt="" width={589} height={439} priority className="h-7 w-auto shrink-0" />
          {/* no celular fica só o monograma, para sobrar espaço para o "Quero ser aluno" */}
          <span className="hidden truncate font-display text-[0.95rem] font-bold uppercase tracking-[0.06em] [font-stretch:112%] sm:block">
            {brand}
          </span>
        </Link>

        <nav aria-label="Seções da página" className="ml-auto hidden items-center gap-0.5 lg:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm text-soft transition-colors hover:bg-white/5 hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-3">
          <LpButton href="/quero-ser-aluno" size="sm">
            Quero ser aluno
          </LpButton>
          {/* "Entrar" no celular fica dentro do menu (o estilo do botão não aceita "hidden" direto) */}
          <span className="hidden sm:contents">
            <LpButton href="/login" variant="ghost" size="sm">
              Entrar
            </LpButton>
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-landing"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-subtle lg:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-landing" aria-label="Seções da página" className="border-t border-line bg-surface px-4 pb-6 pt-2 lg:hidden">
          <ul className="divide-y divide-line">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)} className="block py-3.5 font-display text-lg font-semibold">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-3">
            <LpButton href="/quero-ser-aluno" block onClick={() => setOpen(false)}>
              Quero ser aluno
            </LpButton>
            <LpButton href="/login" variant="ghost" block onClick={() => setOpen(false)}>
              Já sou aluno · Entrar
            </LpButton>
          </div>
        </nav>
      )}
    </header>
  );
}
