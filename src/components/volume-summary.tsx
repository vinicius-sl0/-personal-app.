import { computeVolume, formatSets, secondaryWeightLabel, type MuscleMap, type VolumeInput } from "@/lib/volume";

// Resumo compacto de séries por grupo muscular (usado no editor de ficha, atualiza enquanto edita).
export default function VolumeSummary({
  title,
  inputs,
  map,
  secondaryWeight,
}: {
  title: string;
  inputs: VolumeInput[];
  map: MuscleMap;
  secondaryWeight: number;
}) {
  const { muscles, totals } = computeVolume(inputs, map, secondaryWeight);
  const rows = muscles.filter((m) => m.countedSets > 0).sort((a, b) => b.countedSets - a.countedSets);
  if (totals.sets === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-zinc-50 p-3 text-sm dark:bg-zinc-900/60">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="space-y-1">
        {rows.map((m) => (
          <li key={m.muscle.id} className="flex items-baseline gap-2">
            <span>{m.muscle.name}</span>
            <span aria-hidden className="flex-1 border-b border-dotted border-line-strong" />
            <span className="tabular-nums">
              {formatSets(m.countedSets)} {m.countedSets === 1 ? "série" : "séries"}
            </span>
          </li>
        ))}
        <li className="flex items-baseline gap-2 border-t border-line pt-1 font-semibold">
          <span>Total</span>
          <span aria-hidden className="flex-1" />
          <span className="tabular-nums">{formatSets(totals.sets)} séries</span>
        </li>
      </ul>
      {secondaryWeight > 0 && muscles.some((m) => m.indirectSets > 0) && (
        <p className="mt-2 text-[11px] text-muted">
          Inclui grupos secundários ({secondaryWeightLabel(secondaryWeight).toLowerCase()}). O total conta cada série uma vez.
        </p>
      )}
      {totals.setsWithoutMuscle > 0 && (
        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
          {totals.setsWithoutMuscle} séries de exercícios sem grupo muscular cadastrado.
        </p>
      )}
    </div>
  );
}
