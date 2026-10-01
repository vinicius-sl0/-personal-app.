import Link from "next/link";
import { formatDate } from "@/lib/assessment";
import { formatKcal, formatKcalPerMin, formatMinutes, type CalorieResult } from "@/lib/calories";
import { formatWeek } from "@/lib/feedback";
import { Flame } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Scoreboard } from "@/components/ui/scoreboard";

// Seção "Calorias estimadas" da Análise de Volume (visão Realizado). Tudo marcado como aproximação.
export default function CaloriesSection({
  result,
  singleWeek,
  isPersonal,
}: {
  result: CalorieResult;
  singleWeek: boolean;
  isPersonal: boolean; // só o Personal edita a Biblioteca de exercícios
}) {
  const t = result.totals;
  const notes: string[] = [];
  if (t.sessionsWithoutCheckout > 0) {
    notes.push(
      `${t.sessionsWithoutCheckout} ${t.sessionsWithoutCheckout === 1 ? "treino ficou" : "treinos ficaram"} de fora por não ter check-out (sem duração registrada).`,
    );
  }
  if (t.setsWithoutKcal > 0) {
    notes.push(`${t.setsWithoutKcal} séries são de exercícios sem “calorias por minuto” cadastrado e ficaram de fora.`);
  }
  if (t.longSessions > 0) {
    notes.push(
      `${t.longSessions} ${t.longSessions === 1 ? "treino durou" : "treinos duraram"} mais de 3 horas — talvez o check-out tenha sido feito bem depois do fim do treino.`,
    );
  }

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<Flame className="size-4" />}
        title="Calorias estimadas"
        description="Aproximação, não é medição"
      />

      <Scoreboard
        label="Calorias estimadas"
        items={[
          { label: singleWeek ? "Estimado na semana" : "Estimado no período", value: formatKcal(t.kcal) },
          { label: "Tempo de treino", value: formatMinutes(t.minutes), sub: "Do check-in ao check-out" },
          { label: "Treinos considerados", value: String(t.sessionsWithDuration), sub: "Com check-in e check-out" },
        ]}
      />

      {notes.length > 0 && (
        <ul className="space-y-1 rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          {isPersonal && t.setsWithoutKcal > 0 && (
            <li>
              <Link href="/personal/exercicios" className="font-semibold underline">
                Preencher na Biblioteca de exercícios
              </Link>
            </li>
          )}
        </ul>
      )}

      {!singleWeek && result.weeks.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Por semana</h4>
          <ul className="divide-y divide-line rounded-[10px] border border-line text-sm">
            {result.weeks.map((w) => (
              <li key={w.weekStart} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>
                  {formatWeek(w.weekStart)}
                  <span className="block text-xs text-muted">
                    {w.sessions} {w.sessions === 1 ? "treino" : "treinos"}
                  </span>
                </span>
                <span className="font-display font-semibold tabular-nums">{formatKcal(w.kcal)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.sessions.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Por treino</h4>
          <ul className="divide-y divide-line rounded-[10px] border border-line text-sm">
            {result.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="block text-xs text-muted">
                    {formatDate(s.date)} ·{" "}
                    {s.durationMin === null ? "sem check-out" : formatMinutes(s.durationMin)} · {s.sets}{" "}
                    {s.sets === 1 ? "série" : "séries"}
                  </span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  {s.durationMin === null || s.sets === 0 ? (
                    <span className="text-xs text-muted">não estimado</span>
                  ) : (
                    <>
                      <span className="font-display font-semibold">{formatKcal(s.kcal)}</span>
                      {s.partial && <span className="block text-[11px] text-muted">parcial*</span>}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {result.sessions.some((s) => s.partial) && (
            <p className="text-[11px] text-muted">* Parte dos exercícios desse treino não tem kcal/min cadastrado.</p>
          )}
        </div>
      )}

      {result.exercises.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Por exercício</h4>
          <div className="overflow-x-auto rounded-[10px] border border-line">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-subtle text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Exercício</th>
                  <th scope="col" className="px-3 py-2 font-medium">Séries</th>
                  <th scope="col" className="px-3 py-2 font-medium">Tempo estimado</th>
                  <th scope="col" className="px-3 py-2 font-medium">kcal/min</th>
                  <th scope="col" className="px-3 py-2 font-medium">Calorias estimadas</th>
                </tr>
              </thead>
              <tbody>
                {result.exercises.map((e) => (
                  <tr key={e.key} className="border-t border-line">
                    <th scope="row" className="px-3 py-2 font-medium">{e.name}</th>
                    <td className="px-3 py-2 tabular-nums">{e.sets}</td>
                    <td className="px-3 py-2 tabular-nums">{e.minutes > 0 ? formatMinutes(e.minutes) : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {e.kcalPerMin === null ? <span className="text-xs text-muted">não cadastrado</span> : formatKcalPerMin(e.kcalPerMin)}
                    </td>
                    <td className="px-3 py-2 font-semibold tabular-nums">
                      {e.kcal === null || e.minutes === 0 ? <span className="text-xs font-normal text-muted">—</span> : formatKcal(e.kcal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        Como é estimado: o tempo de cada exercício é a duração do treino (check-in → check-out) dividida conforme as
        séries feitas, com o descanso junto. Calorias estimadas = tempo × kcal/min cadastrado no exercício. O gasto
        real varia com peso, idade, intensidade e condicionamento de cada pessoa.
      </p>
    </Card>
  );
}
