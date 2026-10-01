import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { LANDING } from "@/lib/landing-content";
import { BrandMark } from "@/components/brand-mark";
import LeadWizard from "./lead-wizard";

export const metadata = {
  title: "Quero me tornar aluno",
  description: `Responda algumas perguntas rápidas e converse com ${BRAND.name} pelo WhatsApp.`,
};

// Página pública (sem login): perguntas rápidas → respostas salvas → WhatsApp do Personal.
export default function QueroSerAlunoPage() {
  return (
    <div className="theme-dark flex min-h-dvh flex-col bg-surface text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-3 px-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-soft transition-colors hover:text-ink">
            <ArrowLeft aria-hidden className="size-4" />
            Voltar ao site
          </Link>
          <span className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="font-display text-sm font-semibold">{BRAND.name}</span>
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-8 sm:pt-12">
        <LeadWizard personalName={BRAND.name} whatsapp={LANDING.contact.whatsapp} />
      </main>
    </div>
  );
}
