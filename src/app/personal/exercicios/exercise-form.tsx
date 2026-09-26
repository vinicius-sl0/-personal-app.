"use client";

import { useActionState } from "react";
import { btnPrimaryCls, errorCls, inputCls } from "@/lib/ui";

type Option = { id: string; name: string };

type Values = {
  id?: string;
  name: string;
  primary_muscle_group_id: string;
  secondary_muscle_group_ids: string[];
  equipment_id: string;
  difficulty: string;
  instructions: string;
  video_url: string;
  kcal_per_min: string;
};

const initialState = {} as { error?: string };

export default function ExerciseForm({
  action,
  muscleGroups,
  equipment,
  defaultValues,
  submitLabel,
}: {
  action: (prev: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  muscleGroups: Option[];
  equipment: Option[];
  defaultValues: Values;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {defaultValues.id && <input type="hidden" name="id" value={defaultValues.id} />}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome do exercício</label>
        <input
          name="name"
          required
          defaultValue={defaultValues.name}
          autoComplete="off"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Grupo muscular principal</label>
        <select
          name="primary_muscle_group_id"
          required
          defaultValue={defaultValues.primary_muscle_group_id}
          className={inputCls}
        >
          <option value="">Selecione...</option>
          {muscleGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Grupos secundários (opcional)</label>
        <select
          name="secondary_muscle_group_ids"
          multiple
          defaultValue={defaultValues.secondary_muscle_group_ids}
          className={`${inputCls} h-auto py-2`}
          size={5}
        >
          {muscleGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          Toque mantendo pressionado (ou Ctrl/Cmd + clique no computador) para marcar mais de um.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Equipamento</label>
        <select name="equipment_id" defaultValue={defaultValues.equipment_id} className={inputCls}>
          <option value="">Não informar</option>
          {equipment.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nível</label>
        <select name="difficulty" defaultValue={defaultValues.difficulty} className={inputCls}>
          <option value="iniciante">Iniciante</option>
          <option value="intermediario">Intermediário</option>
          <option value="avancado">Avançado</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="kcal_per_min" className="text-sm font-medium">
          Calorias estimadas por minuto (opcional)
        </label>
        <input
          id="kcal_per_min"
          name="kcal_per_min"
          inputMode="decimal"
          defaultValue={defaultValues.kcal_per_min}
          placeholder="Ex.: 7,5"
          className={inputCls}
        />
        <p className="text-xs text-zinc-500">
          Média aproximada de kcal por minuto, contando o descanso entre séries. Usada só para as
          “Calorias estimadas” da Análise de Volume — é uma estimativa, não uma medição.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Como executar (opcional)</label>
        <textarea
          name="instructions"
          rows={4}
          defaultValue={defaultValues.instructions}
          className={`${inputCls} h-auto py-2`}
          placeholder="Passo a passo do movimento, pontos de atenção, respiração..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Link do vídeo (opcional)</label>
        <input
          name="video_url"
          type="url"
          inputMode="url"
          defaultValue={defaultValues.video_url}
          placeholder="https://..."
          className={inputCls}
        />
        <p className="text-xs text-zinc-500">
          Use apenas vídeos seus ou que você tem autorização para usar.
        </p>
      </div>

      {state.error && (
        <p role="alert" className={errorCls}>
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={btnPrimaryCls}>
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
