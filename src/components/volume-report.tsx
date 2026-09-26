import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth";
import { weekRange } from "@/lib/attendance";
import { currentWeekStart, formatWeek, shiftWeek, shortDate, weekEndOf, weekStartOf } from "@/lib/feedback";
import {
  computeByExercise,
  computeVolume,
  formatRange,
  formatSets,
  secondaryWeightLabel,
  type VolumeInput,
  type VolumeResult,
} from "@/lib/volume";
import {
  loadExerciseKcal,
  loadLoggedInputs,
  loadMuscleMap,
  loadPlanWorkouts,
  loadSessions,
  type PlanWorkout,
} from "@/lib/volume-data";
import { estimateCalories, type CalorieResult } from "@/lib/calories";
import { errorCls } from "@/lib/ui";
import VolumeAnalysis from "@/components/volume-analysis";
import VolumeTrends, { type TrendRow } from "@/components/volume-trends";
import { loadVolumeTrends } from "@/lib/volume-trends-data";
import CaloriesSection from "@/components/calories-section";
import { VolumeFilters, type VolumeQuery } from "@/components/volume-controls";

const isDate = (v?: string): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line p-3 bg-card">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Totals({ result, extra, isPersonal }: { result: VolumeResult; extra?: React.ReactNode; isPersonal: boolean }) {
  const t = result.totals;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Séries" value={formatSets(t.sets)} />
        <Tile label="Exercícios" value={String(t.exercises)} />
        <Tile label="Repetições" value={formatRange(t.reps)} sub={t.setsWithoutReps ? `${t.setsWithoutReps} séries sem número` : undefined} />
        <Tile
          label="Volume de carga"
          value={formatRange(t.loadVolume, "kg")}
          sub={t.setsWithoutLoad ? `${t.setsWithoutLoad} séries fora do cálculo` : undefined}
        />
      </div>
      {extra}
      {t.setsWithoutMuscle > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {t.setsWithoutMuscle} séries são de exercícios sem grupo muscular principal cadastrado e não entram na divisão
          por grupo.{isPersonal && " Corrija na Biblioteca de exercícios."}
        </p>
      )}
    </div>
  );
}

// Relatório de volume de treino (e calorias estimadas) de UM aluno.
// Usado pelo Personal (/personal/treinos/volume, escolhendo o aluno) e pelo próprio aluno
// (/aluno/treinos/volume). A RLS garante que o aluno só lê a própria ficha ativa e os próprios treinos.
export default async function VolumeReport({
  role,
  student,
  students,
  weight,
  query,
  basePath,
}: {
  role: Role;
  student: { id: string; full_name: string } | null;
  students?: { id: string; full_name: string }[]; // lista para o Personal escolher o aluno
  weight: number; // configuração do Personal para grupos secundários
  query: VolumeQuery;
  basePath: string;
}) {
  const supabase = await createClient();
  const isPersonal = role === "personal";

  // Ficha usada: a ativa; se não houver, a mais recente.
  let plan: { id: string; name: string; status: string } | null = null;
  let workouts: PlanWorkout[] = [];
  let loadError: string | null = null;
  if (student) {
    const { data: plans } = await supabase
      .from("workout_plans")
      .select("id, name, status, created_at")
      .eq("student_id", student.id)
      .eq("is_template", false)
      .order("created_at", { ascending: false });
    plan = plans?.find((p) => p.status === "ativo") ?? plans?.[0] ?? null;
    if (plan) {
      const res = await loadPlanWorkouts(supabase, plan.id);
      workouts = res.workouts;
      loadError = res.error;
    }
  }
  const workout = workouts.find((w) => w.id === query.treino) ?? null;
  const { data: muscleRows } = await supabase.from("muscle_groups").select("id, name").order("sort_order");
  const muscles = muscleRows ?? [];
  const grupo = muscles.find((m) => m.id === query.grupo) ?? null;
  const visao = query.visao === "realizado" ? "realizado" : "planejado";

  // ---------------- dados de entrada do cálculo ----------------
  let inputs: VolumeInput[] = [];
  let periodLabel = "";
  let weeks = 1;
  let sessions = 0;
  let nav: { prev: string; next: string | null } | null = null;
  let periodError: string | null = null;
  let calories: CalorieResult | null = null;

  const base = (patch: Partial<VolumeQuery>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...query, ...patch })) if (v) p.set(k, v);
    return `${basePath}?${p.toString()}`;
  };

  if (student && visao === "planejado") {
    inputs = (workout ? [workout] : workouts).flatMap((w) => w.inputs);
  } else if (student) {
    const thisWeek = currentWeekStart();
    let range: { from: string; to: string };
    if (query.periodo === "4semanas") {
      const start = shiftWeek(thisWeek, -3);
      range = { from: weekRange(start).from, to: weekRange(thisWeek).to };
      weeks = 4;
      periodLabel = `Últimas 4 semanas (${shortDate(start)} a ${shortDate(weekEndOf(thisWeek))})`;
    } else if (query.periodo === "personalizado") {
      const de = isDate(query.de) ? query.de : null;
      const ate = isDate(query.ate) ? query.ate : null;
      if (!de || !ate || ate < de) {
        periodError = "Escolha as datas “De” e “Até” (a data final não pode ser antes da inicial).";
        range = { from: "", to: "" };
      } else {
        const days = Math.round((Date.parse(ate) - Date.parse(de)) / 86400000) + 1;
        if (days > 366) periodError = "Escolha um período de até 1 ano.";
        range = { from: `${de}T00:00:00-03:00`, to: `${ate}T23:59:59.999-03:00` };
        weeks = Math.max(days / 7, 1);
        periodLabel = `De ${shortDate(de)} a ${shortDate(ate)} (${days} dias)`;
      }
    } else {
      const requested = isDate(query.semana) ? weekStartOf(query.semana) : thisWeek;
      const weekStart = requested > thisWeek ? thisWeek : requested;
      range = weekRange(weekStart);
      periodLabel = weekStart === thisWeek ? "Esta semana" : formatWeek(weekStart);
      nav = {
        prev: base({ periodo: "semana", semana: shiftWeek(weekStart, -1) }),
        next: weekStart < thisWeek ? base({ periodo: "semana", semana: shiftWeek(weekStart, 1) }) : null,
      };
    }
    if (!periodError) {
      const [res, sess] = await Promise.all([
        loadLoggedInputs(supabase, student.id, range, workout?.id),
        loadSessions(supabase, student.id, range, workout?.id),
      ]);
      inputs = res.inputs;
      sessions = res.sessions;
      loadError = res.error ?? sess.error;

      // Calorias estimadas: duração registrada (check-in → check-out) × kcal/min de cada exercício.
      if (!loadError) {
        const { kcal, error: kcalError } = await loadExerciseKcal(
          supabase,
          res.logs.map((l) => l.exercise_id).filter((x): x is string => !!x),
        );
        loadError = kcalError;
        calories = estimateCalories(sess.sessions, res.logs, kcal);
      }
    }
  }

  const { map, error: mapError } = await loadMuscleMap(
    supabase,
    inputs.map((i) => i.exerciseId).filter((x): x is string => !!x),
  );
  const result = computeVolume(inputs, map, weight);
  const error = loadError ?? mapError;

  const byExercise = computeByExercise(inputs, map, grupo?.id);

  // Evolução semanal/mensal (só no realizado).
  const trends =
    student && visao === "realizado" && !periodError && !loadError
      ? await loadVolumeTrends(supabase, student.id, weight, { workoutId: workout?.id, muscleId: grupo?.id, map })
      : { weekly: [] as TrendRow[], monthly: [] as TrendRow[], error: null };
  const { weekly, monthly } = trends;

  // Resumo de cada treino da ficha (só no planejado com "todos os treinos").
  const perWorkout =
    visao === "planejado" && !workout && workouts.length > 1
      ? workouts.map((w) => ({ w, r: computeVolume(w.inputs, map, weight) }))
      : [];

  return (
    <div className="space-y-4">
      <VolumeFilters
        students={students?.map((s) => ({ id: s.id, name: s.full_name }))}
        workouts={workouts.map((w) => ({ id: w.id, name: w.name }))}
        muscles={muscles}
        query={query}
      />

      {!student && (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          {isPersonal ? "Escolha um aluno para ver o volume de treino por grupo muscular." : "Cadastro de aluno não encontrado."}
        </p>
      )}

      {student && !plan && visao === "planejado" && (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          {isPersonal ? (
            <>
              {student.full_name} ainda não tem ficha de treino.{" "}
              <Link href={`/personal/alunos/${student.id}/treinos/novo`} className="underline">
                Montar ficha
              </Link>
            </>
          ) : (
            "Seu Personal ainda não publicou uma ficha de treino para você."
          )}
        </p>
      )}

      {error && <p className={errorCls}>Não foi possível calcular o volume: {error}</p>}
      {periodError && <p className={errorCls}>{periodError}</p>}
      {trends.error && <p className={errorCls}>Não foi possível carregar a evolução semanal/mensal: {trends.error}</p>}

      {student && !error && !periodError && (plan || visao === "realizado") && (
        <>
          <div className="space-y-1">
            {visao === "planejado" && plan && (
              <p className="text-sm">
                Ficha: <strong>{plan.name}</strong>
                {plan.status !== "ativo" && <span className="text-muted"> (não é a ficha ativa)</span>} ·{" "}
                {workout ? workout.name : `Ciclo completo: ${workouts.length} treino(s), cada um feito 1 vez`}
              </p>
            )}
            {visao === "realizado" && (
              <div className="flex items-center justify-between gap-2">
                {nav ? (
                  <Link href={nav.prev} className="text-sm underline">
                    ← Anterior
                  </Link>
                ) : (
                  <span />
                )}
                <p className="text-center text-sm font-medium">
                  {periodLabel}
                  {workout && ` · ${workout.name}`}
                </p>
                {nav?.next ? (
                  <Link href={nav.next} className="text-sm underline">
                    Próxima →
                  </Link>
                ) : (
                  <span className="w-16" />
                )}
              </div>
            )}
            <p className="text-xs text-muted">
              Grupos secundários: <strong>{secondaryWeightLabel(weight)}</strong>
              {weight > 0 && " (a parte do secundário aparece em laranja no gráfico)"}
              {!isPersonal && " — definido pelo seu Personal"}.
            </p>
          </div>

          {inputs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {visao === "planejado"
                ? "A ficha ainda não tem exercícios."
                : isPersonal
                  ? "Nenhuma série registrada neste período. O volume realizado vem das séries que o aluno marca como feitas na execução do treino."
                  : "Nenhuma série registrada neste período. O volume realizado vem das séries que você marca com “Concluir série” durante o treino."}
            </p>
          ) : (
            <>
              <Totals
                isPersonal={isPersonal}
                result={result}
                extra={
                  visao === "realizado" ? (
                    <p className="text-xs text-muted">
                      {sessions} {sessions === 1 ? "treino registrado" : "treinos registrados"} no período.
                    </p>
                  ) : null
                }
              />

              <VolumeAnalysis
                muscles={result.muscles}
                exact={visao === "realizado"}
                frequencyLabel={visao === "planejado" ? "treino(s) da ficha" : "×/semana"}
                frequencyDivisor={visao === "realizado" ? weeks : 1}
                selectedMuscleId={grupo?.id}
              />

              <div className="rounded-2xl border border-line bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
                  <h3 className="font-semibold">Volume por exercício</h3>
                  <p className="text-xs text-muted">
                    {grupo ? `Exercícios que trabalham ${grupo.name}` : "Todos os exercícios do período"} · volume do próprio exercício
                  </p>
                </div>
                {byExercise.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted">Nenhum exercício {grupo ? `de ${grupo.name} ` : ""}neste recorte.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="text-xs text-muted">
                        <tr>
                          <th scope="col" className="px-4 py-2 font-medium">Exercício</th>
                          <th scope="col" className="px-4 py-2 font-medium">Séries</th>
                          <th scope="col" className="px-4 py-2 font-medium">Repetições</th>
                          <th scope="col" className="px-4 py-2 font-medium">Volume de carga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byExercise.slice(0, 20).map((e) => (
                          <tr key={e.exerciseId} className="border-t border-line align-top">
                            <th scope="row" className="px-4 py-2.5 font-medium">
                              {e.name}
                              <span className="block text-xs font-normal text-muted">
                                {e.primary ?? "sem grupo"}
                                {e.role === "secundário" && " · trabalha o grupo como secundário"}
                              </span>
                            </th>
                            <td className="px-4 py-2.5 tabular-nums">{formatSets(e.sets)}</td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {formatRange(e.reps)}
                              {e.setsWithoutReps > 0 && <span className="block text-xs text-muted">{e.setsWithoutReps} séries sem número</span>}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {formatRange(e.loadVolume, "kg")}
                              {e.setsWithoutLoad > 0 && <span className="block text-xs text-muted">{e.setsWithoutLoad} séries sem carga</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {calories && calories.sessions.length > 0 && (
                <CaloriesSection result={calories} singleWeek={!query.periodo || query.periodo === "semana"} />
              )}
              {visao === "realizado" && weekly.length > 0 && (
                <VolumeTrends weekly={weekly} monthly={monthly} subject={grupo?.name ?? "todos os grupos"} muscleFiltered={!!grupo} />
              )}
              {visao === "planejado" && (
                <p className="text-xs text-muted">
                  🔥 As <strong>calorias estimadas</strong> aparecem na visão <strong>Realizado</strong>, porque usam a
                  duração registrada em cada treino (check-in → check-out).
                </p>
              )}

              {perWorkout.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Por treino</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {perWorkout.map(({ w, r }) => (
                      <Link
                        key={w.id}
                        href={base({ treino: w.id })}
                        className="block rounded-xl border border-line p-3 text-sm hover:bg-subtle bg-card"
                      >
                        <p className="font-medium">
                          {w.name} · {formatSets(r.totals.sets)} séries
                        </p>
                        <p className="text-xs text-muted">
                          {r.muscles
                            .filter((m) => m.countedSets > 0)
                            .sort((a, b) => b.countedSets - a.countedSets)
                            .map((m) => `${m.muscle.name} ${formatSets(m.countedSets)}`)
                            .join(" · ")}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <details className="rounded-xl border border-line p-4 text-sm bg-card">
            <summary className="cursor-pointer font-medium">Como o volume é calculado</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-soft">
              <li>
                <strong>Planejado</strong>: usa a ficha (séries, repetições e carga de cada exercício). O “ciclo completo”
                soma cada treino uma vez.
              </li>
              <li>
                <strong>Realizado</strong>: usa as séries marcadas como feitas no treino, com as repetições e a carga
                registradas.
              </li>
              <li>
                Cada série conta 1 para o <strong>grupo principal</strong> do exercício e “{secondaryWeightLabel(weight)}”
                para cada <strong>grupo secundário</strong>
                {isPersonal ? " (configurável acima)." : " (definido pelo seu Personal)."}
              </li>
              <li>
                <strong>Repetições</strong> = séries × repetições. Faixas como 8–12 aparecem como faixa (mínimo–máximo),
                nunca como média.
              </li>
              <li>
                <strong>Volume de carga</strong> = séries × repetições × carga (kg). Séries sem carga ou com repetição em
                texto (ex.: “até a falha”) contam como séries, mas ficam fora desse cálculo — a tela mostra quantas.
              </li>
              <li>
                <strong>Frequência</strong>: no planejado, em quantos treinos da ficha o grupo aparece; no realizado, em
                quantos dias por semana o grupo foi treinado.
              </li>
              <li>Os totais do topo contam cada série uma vez só (sem somar principal e secundário).</li>
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
