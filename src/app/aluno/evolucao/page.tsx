import { BarChart3, CalendarCheck, Camera, Ruler } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Evolução" };

const SECTIONS = [
  {
    href: "/aluno/avaliacoes",
    icon: Ruler,
    title: "Medidas e composição corporal",
    description: "Peso, gordura, massa magra e medidas ao longo das suas avaliações.",
  },
  {
    href: "/aluno/fotos",
    icon: Camera,
    title: "Fotos de progresso",
    description: "Frente, costas e lados — compare antes e depois.",
  },
  {
    href: "/aluno/treinos/historico",
    icon: CalendarCheck,
    title: "Frequência",
    description: "Seus check-ins e check-outs por semana e por mês.",
  },
  {
    href: "/aluno/treinos/volume",
    icon: BarChart3,
    title: "Volume de treino",
    description: "Séries, carga por grupo muscular e calorias estimadas.",
  },
];

export default async function EvolucaoPage() {
  await requireRole("aluno");
  return (
    <>
      <PageHeader eyebrow="Evolução" title="Sua evolução" description="Tudo o que mostra o seu progresso, em um só lugar." />
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ href, icon: Icon, title, description }) => (
          <Card key={href} href={href}>
            <span aria-hidden className="mb-4 grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
              <Icon className="size-5" />
            </span>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
