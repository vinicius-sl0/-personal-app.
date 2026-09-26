import Link from "next/link";
import { BarChart3, Camera, CalendarCheck, Ruler, Scale, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadSeries } from "@/lib/assessment-data";
import { loadSecondaryWeight } from "@/lib/volume-data";
import { loadVolumeTrends } from "@/lib/volume-trends-data";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import BodyOverview from "@/components/body-overview";
import EvolutionPanel from "@/components/evolution-panel";
import VolumeTrends from "@/components/volume-trends";

export const metadata = { title: "Evolução" };

// Medidas que resumem a composição corporal (a 1ª que existir de cada grupo).
const BODY_KEYS = [["weight_kg"], ["body_fat_pct"], ["muscle_mass_kg", "lean_mass_kg"], ["bmi"]];

const SHORTCUTS = [
  { href: "/aluno/fotos", icon: Camera, title: "Fotos de progresso", text: "Frente, costas e lados — antes e depois" },
  { href: "/aluno/treinos/historico", icon: CalendarCheck, title: "Frequência", text: "Check-ins por semana e por mês" },
  { href: "/aluno/treinos/volume", icon: BarChart3, title: "Volume de treino", text: "Por grupo muscular e por exercício" },
  { href: "/aluno/avaliacoes", icon: Ruler, title: "Avaliações", text: "Todas as medidas de cada avaliação" },
];

export default async function EvolucaoPage() {
  await requireRole("aluno");
  const supabase = await createClient();
  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase.from("students").select("id, personal_id").maybeSingle();
  if (!student) return <ErrorState message="Cadastro de aluno não encontrado." />;

  const weight = await loadSecondaryWeight(supabase, student.personal_id);
  const [{ series, error: seriesError }, trends] = await Promise.all([
    loadSeries(supabase, student.id),
    loadVolumeTrends(supabase, student.id, weight),
  ]);

  const body = BODY_KEYS.map((keys) => keys.map((k) => series.find((s) => s.metric.key === k)).find(Boolean)).filter(
    (s): s is NonNullable<typeof s> => !!s,
  );
  const measures = series.filter((s) => s.metric.category === "circunferencia");
  const hasTraining = trends.weekly.some((w) => w.sessions > 0 || w.sets > 0);

  return (
    <>
      <PageHeader eyebrow="Evolução" title="Sua evolução" description="Seu corpo, sua frequência e seu treino ao longo do tempo." />

      <div className="space-y-8">
        <section aria-labelledby="corpo" className="space-y-3">
          <h2 id="corpo" className="flex items-center gap-2 text-lg font-semibold">
            <Scale aria-hidden className="size-5 text-brand-ink" /> Composição corporal
          </h2>
          {seriesError && <ErrorState message={`Não foi possível carregar suas avaliações: ${seriesError.message}`} />}
          {!seriesError && body.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="size-5" />}
              title="Ainda sem avaliações"
              description="Quando seu Personal registrar sua primeira avaliação, os gráficos de peso, gordura e massa muscular aparecem aqui."
            />
          ) : (
            <BodyOverview series={body} />
          )}
        </section>

        {measures.length > 0 && (
          <section aria-labelledby="medidas" className="space-y-3">
            <h2 id="medidas" className="flex items-center gap-2 text-lg font-semibold">
              <Ruler aria-hidden className="size-5 text-brand-ink" /> Medidas corporais
            </h2>
            <EvolutionPanel series={measures} initialKey="circ_waist" />
          </section>
        )}

        <section aria-labelledby="treino" className="space-y-3">
          <h2 id="treino" className="flex items-center gap-2 text-lg font-semibold">
            <CalendarCheck aria-hidden className="size-5 text-brand-ink" /> Frequência, volume e calorias
          </h2>
          {trends.error && <ErrorState message={`Não foi possível carregar seus treinos: ${trends.error}`} />}
          {!trends.error &&
            (hasTraining ? (
              <VolumeTrends
                weekly={trends.weekly}
                monthly={trends.monthly}
                subject="todos os grupos"
                muscleFiltered={false}
                initialMetric="sessions"
                title="Seu treino ao longo do tempo"
              />
            ) : (
              <EmptyState
                icon={<CalendarCheck className="size-5" />}
                title="Nenhum treino registrado ainda"
                description="Faça o check-in, conclua as séries e o check-out: sua frequência, volume e calorias estimadas aparecem aqui."
              />
            ))}
        </section>

        <section aria-labelledby="mais" className="space-y-3">
          <h2 id="mais" className="text-lg font-semibold">
            Mais detalhes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SHORTCUTS.map(({ href, icon: Icon, title, text }) => (
              <Card key={href} href={href}>
                <CardHeader icon={<Icon className="size-4" />} title={title} description={text} />
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted">
            <Link href="/aluno/feedback" className="underline-offset-2 hover:underline">
              Conte como foi sua semana no Feedback semanal →
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
