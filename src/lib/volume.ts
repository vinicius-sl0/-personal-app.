// ANÁLISE DE VOLUME DE TREINO por grupo muscular — cálculo puro (servidor e navegador).
//
// De onde vêm os dados (nada é inventado):
//   grupo principal   → exercises.primary_muscle_group_id
//   grupos secundários → exercise_muscle_groups
//   PLANEJADO → workout_exercises: sets, reps_min/reps_max (ou reps_text), target_load_kg
//   REALIZADO → set_logs: cada linha é 1 série feita (reps_done, load_kg), data da workout_sessions
//
// Regras:
//   • Cada série conta 1 para o grupo PRINCIPAL e `secondaryWeight` (0, 0,5 ou 1) para cada
//     grupo SECUNDÁRIO. O mesmo peso vale para repetições e volume de carga do secundário.
//   • Repetições planejadas em faixa (8–12) viram faixa no resultado (mín–máx), nunca média.
//   • Repetição em texto ("até a falha") ou carga em branco: a série conta em "séries", mas fica
//     fora de repetições/volume de carga — e é contada à parte para a tela avisar.
//   • Volume de carga = séries × repetições × carga (kg).
//   • Os totais gerais contam cada série UMA vez (sem somar principal + secundário).

export type Muscle = { id: string; name: string; sort: number };
export type ExerciseMuscles = { primary: Muscle | null; secondary: Muscle[] };
export type MuscleMap = Record<string, ExerciseMuscles>;
export type Range = { min: number; max: number };

// Um bloco de séries iguais de um exercício (uma linha da ficha, ou uma série registrada).
export type VolumeInput = {
  exerciseId: string | null;
  sets: number;
  reps: Range | null; // repetições POR SÉRIE; null = não numérico / não informado
  loadKg: number | null; // carga por série; null = não informada
  groupKey: string; // treino (planejado) ou dia (realizado) — usado na frequência
};

export type MuscleVolume = {
  muscle: Muscle;
  directSets: number; // séries em que é o grupo principal
  indirectSets: number; // séries em que é grupo secundário (contagem bruta)
  countedSets: number; // direct + peso × indirect
  exercises: number; // exercícios diferentes que o trabalham (secundário só se o peso > 0)
  reps: Range; // repetições contabilizadas
  loadVolume: Range; // kg contabilizados (séries × reps × carga)
  directReps: Range; // parte de `reps` que veio de séries como grupo principal
  directLoadVolume: Range; // parte de `loadVolume` que veio de séries como grupo principal
  setsWithoutReps: number; // séries contabilizadas sem repetição numérica
  setsWithoutLoad: number; // séries contabilizadas sem carga (ou sem repetição) — fora do volume de carga
  frequency: number; // quantos treinos (planejado) ou dias (realizado) diferentes o trabalham
};

export type VolumeTotals = {
  sets: number;
  exercises: number;
  reps: Range;
  loadVolume: Range;
  setsWithoutReps: number;
  setsWithoutLoad: number;
  setsWithoutMuscle: number; // exercício sem grupo principal cadastrado
};

export type VolumeResult = { muscles: MuscleVolume[]; totals: VolumeTotals };

const zero = (): Range => ({ min: 0, max: 0 });
const add = (a: Range, b: Range, k = 1) => ({ min: a.min + b.min * k, max: a.max + b.max * k });

export function computeVolume(inputs: VolumeInput[], map: MuscleMap, secondaryWeight: number): VolumeResult {
  const acc = new Map<string, MuscleVolume & { _ex: Set<string>; _keys: Set<string> }>();
  const totals: VolumeTotals = {
    sets: 0,
    exercises: 0,
    reps: zero(),
    loadVolume: zero(),
    setsWithoutReps: 0,
    setsWithoutLoad: 0,
    setsWithoutMuscle: 0,
  };
  const totalExercises = new Set<string>();

  const slot = (m: Muscle) => {
    let v = acc.get(m.id);
    if (!v) {
      v = {
        muscle: m,
        directSets: 0,
        indirectSets: 0,
        countedSets: 0,
        exercises: 0,
        reps: zero(),
        loadVolume: zero(),
        directReps: zero(),
        directLoadVolume: zero(),
        setsWithoutReps: 0,
        setsWithoutLoad: 0,
        frequency: 0,
        _ex: new Set(),
        _keys: new Set(),
      };
      acc.set(m.id, v);
    }
    return v;
  };

  for (const it of inputs) {
    if (it.sets <= 0) continue;
    const repsTotal = it.reps ? { min: it.sets * it.reps.min, max: it.sets * it.reps.max } : null;
    const loadTotal =
      repsTotal && it.loadKg !== null ? { min: repsTotal.min * it.loadKg, max: repsTotal.max * it.loadKg } : null;

    totals.sets += it.sets;
    if (repsTotal) totals.reps = add(totals.reps, repsTotal);
    else totals.setsWithoutReps += it.sets;
    if (loadTotal) totals.loadVolume = add(totals.loadVolume, loadTotal);
    else totals.setsWithoutLoad += it.sets;
    if (it.exerciseId) totalExercises.add(it.exerciseId);

    const muscles = it.exerciseId ? map[it.exerciseId] : undefined;
    if (!muscles?.primary) {
      totals.setsWithoutMuscle += it.sets;
      continue;
    }

    const apply = (m: Muscle, weight: number, direct: boolean) => {
      const v = slot(m);
      if (direct) v.directSets += it.sets;
      else v.indirectSets += it.sets;
      if (weight <= 0) return;
      v.countedSets += it.sets * weight;
      if (repsTotal) {
        v.reps = add(v.reps, repsTotal, weight);
        if (direct) v.directReps = add(v.directReps, repsTotal);
      } else v.setsWithoutReps += it.sets * weight;
      if (loadTotal) {
        v.loadVolume = add(v.loadVolume, loadTotal, weight);
        if (direct) v.directLoadVolume = add(v.directLoadVolume, loadTotal);
      } else v.setsWithoutLoad += it.sets * weight;
      if (it.exerciseId) v._ex.add(it.exerciseId);
      v._keys.add(it.groupKey);
    };

    apply(muscles.primary, 1, true);
    for (const m of muscles.secondary) {
      if (m.id !== muscles.primary.id) apply(m, secondaryWeight, false);
    }
  }

  totals.exercises = totalExercises.size;
  const muscles = [...acc.values()]
    .map(({ _ex, _keys, ...v }) => ({ ...v, exercises: _ex.size, frequency: _keys.size }))
    .sort((a, b) => a.muscle.sort - b.muscle.sort || a.muscle.name.localeCompare(b.muscle.name));
  return { muscles, totals };
}

// ---------------------------------------------------------------------
// Entradas a partir dos dados do banco
// ---------------------------------------------------------------------

// Linha da ficha (workout_exercises) → entrada do cálculo PLANEJADO.
export function plannedInput(
  we: {
    exercise_id: string;
    sets: number;
    reps_min: number | null;
    reps_max: number | null;
    target_load_kg: number | null;
  },
  workoutKey: string,
): VolumeInput {
  const reps = we.reps_min !== null ? { min: we.reps_min, max: Math.max(we.reps_max ?? we.reps_min, we.reps_min) } : null;
  return { exerciseId: we.exercise_id, sets: we.sets, reps, loadKg: we.target_load_kg, groupKey: workoutKey };
}

// Série registrada (set_logs) → entrada do cálculo REALIZADO (1 série).
export function loggedInput(
  log: { exercise_id: string | null; reps_done: number | null; load_kg: number | null },
  day: string,
): VolumeInput {
  const reps = log.reps_done !== null ? { min: log.reps_done, max: log.reps_done } : null;
  return { exerciseId: log.exercise_id, sets: 1, reps, loadKg: log.load_kg, groupKey: day };
}

// ---------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------
const nf = (max: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: max });

export function formatSets(n: number) {
  return nf(1).format(n);
}

export function formatRange(r: Range, unit = "", decimals = 0) {
  const f = nf(decimals);
  const u = unit ? ` ${unit}` : "";
  if (Math.abs(r.max - r.min) < 1e-9) return `${f.format(r.min)}${u}`;
  return `${f.format(r.min)}–${f.format(r.max)}${u}`;
}

export const SECONDARY_WEIGHT_OPTIONS = [
  { value: 0, label: "Não contam", hint: "Só o grupo principal recebe a série" },
  { value: 0.5, label: "Meia série", hint: "Cada série vale 0,5 para o grupo secundário" },
  { value: 1, label: "Série inteira", hint: "Cada série vale 1 também para o secundário" },
] as const;

export function secondaryWeightLabel(w: number) {
  return SECONDARY_WEIGHT_OPTIONS.find((o) => o.value === w)?.label ?? `${nf(2).format(w)} série`;
}
