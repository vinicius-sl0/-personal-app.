"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { inputCls } from "@/lib/ui";

type Option = { id: string; name: string };

export default function ExerciseFilters({
  muscleGroups,
  equipment,
}: {
  muscleGroups: Option[];
  equipment: Option[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.push(`/personal/exercicios?${next.toString()}`));
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <input
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        placeholder="Buscar por nome..."
        className={inputCls}
      />
      <select
        defaultValue={params.get("grupo") ?? ""}
        onChange={(e) => update("grupo", e.target.value)}
        className={inputCls}
      >
        <option value="">Todos os grupos</option>
        {muscleGroups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <select
        defaultValue={params.get("equip") ?? ""}
        onChange={(e) => update("equip", e.target.value)}
        className={inputCls}
      >
        <option value="">Todos os equipamentos</option>
        {equipment.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </div>
  );
}
