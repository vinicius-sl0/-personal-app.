import Link from "next/link";
import { Activity, CalendarCheck, Dumbbell, LineChart } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";

const HIGHLIGHTS = [
  { icon: Dumbbell, text: "Treinos montados para você, com vídeo de cada exercício" },
  { icon: CalendarCheck, text: "Check-in e check-out de cada treino" },
  { icon: LineChart, text: "Evolução com avaliações, fotos e volume de treino" },
];

// Layout das telas de acesso (login, recuperar senha, nova senha).
export default function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Painel da marca (computador) — sempre escuro. */}
      <aside className="theme-dark relative hidden overflow-hidden bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="relative flex items-center gap-3">
          <BrandMark size="lg" />
          <span className="text-lg font-bold">{BRAND.name}</span>
        </Link>
        <div className="relative max-w-md">
          <p className="text-4xl font-bold leading-tight tracking-tight">
            Treino sério,
            <br />
            resultado medido.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-soft">
                <span className="grid size-9 place-items-center rounded-xl border border-line bg-card text-brand-ink">
                  <Icon aria-hidden className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-muted">
          <Activity aria-hidden className="size-3.5" /> Seus dados de saúde ficam protegidos e só o seu Personal tem acesso.
        </p>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm animate-slide-up">
          <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <BrandMark size="md" />
            <span className="font-bold">{BRAND.name}</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
