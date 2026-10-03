"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";

// Topo da página inicial (só da landing). Transparente sobre a foto do topo; ganha fundo ao rolar.
// No celular, o menu abre num painel com as seções, "Quero ser aluno" e "Entrar".
export default function LandingHeader({ nav }: { nav: { href: string; label: string }[] }) {
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
        solid ? "border-b border-line bg-surface/90 backdrop-blur" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark size="md" />
          <span className="truncate font-display font-semibold">{BRAND.name}</span>
        </Link>

        <nav aria-label="Seções da página" className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="rounded-[10px] px-3 py-2 text-sm text-soft transition-colors hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Link
            href="/quero-ser-aluno"
            className="hidden h-10 items-center rounded-[10px] bg-brand px-4 font-display text-sm font-semibold text-brand-contrast shadow-[inset_0_1px_0_rgb(255_255_255/0.28)] transition-colors hover:bg-brand-hover sm:inline-flex"
          >
            Quero ser aluno
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-[10px] border border-line-strong px-4 font-display text-sm font-semibold text-ink transition-colors hover:border-chrome hover:bg-subtle"
          >
            Entrar
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-landing"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="grid size-10 place-items-center rounded-[10px] text-ink transition-colors hover:bg-subtle lg:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-landing" aria-label="Seções da página" className="border-t border-line bg-surface px-4 pb-5 pt-2 lg:hidden">
          <ul className="divide-y divide-line">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)} className="block py-3.5 font-display text-lg font-semibold">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/quero-ser-aluno"
            className="mt-4 flex h-12 items-center justify-center rounded-[10px] bg-brand font-display font-semibold text-brand-contrast"
          >
            Quero me tornar aluno
          </Link>
        </nav>
      )}
    </header>
  );
}
