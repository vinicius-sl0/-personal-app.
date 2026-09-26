"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setSecondaryWeight } from "@/lib/volume-actions";
import { SECONDARY_WEIGHT_OPTIONS } from "@/lib/volume";
import { btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";

export type VolumeQuery = {
  aluno?: string;
  visao?: string;
  treino?: string;
  periodo?: string;
  semana?: string;
  de?: string;
  ate?: string;
  grupo?: string; // id do grupo muscular filtrado
};

// Filtros da análise: cada mudança vira um novo endereço (dá para salvar/compartilhar o link).
export function VolumeFilters({
  students,
  workouts,
  muscles = [],
  query,
}: {
  students?: { id: string; name: string }[]; // só o Personal escolhe o aluno
  workouts: { id: string; name: string }[];
  muscles?: { id: string; name: string }[];
  query: VolumeQuery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [de, setDe] = useState(query.de ?? "");
  const [ate, setAte] = useState(query.ate ?? "");

  function go(patch: Partial<VolumeQuery>) {
    const next: VolumeQuery = { ...query, ...patch };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const visao = query.visao === "realizado" ? "realizado" : "planejado";
  const periodo = query.periodo ?? "semana";
  const selectCls = `${inputCls} !h-10 text-sm`;

  return (
    <div className={`space-y-3 rounded-xl border border-line bg-card p-4 ${pending ? "opacity-60" : ""}`}>
      <div className={`grid gap-3 ${students ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {students && (
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted">Aluno</span>
            <select
              value={query.aluno ?? ""}
              onChange={(e) => go({ aluno: e.target.value, treino: undefined })}
              className={selectCls}
            >
              <option value="">Escolha um aluno</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Treino</span>
          <select
            value={query.treino ?? ""}
            onChange={(e) => go({ treino: e.target.value || undefined })}
            disabled={(students && !query.aluno) || workouts.length === 0}
            className={selectCls}
          >
            <option value="">Todos os treinos</option>
            {workouts.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Grupo muscular</span>
          <select
            value={query.grupo ?? ""}
            onChange={(e) => go({ grupo: e.target.value || undefined })}
            disabled={(students && !query.aluno) || muscles.length === 0}
            className={selectCls}
          >
            <option value="">Todos os grupos</option>
            {muscles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="group" aria-label="Visão" className="flex gap-1 rounded-xl border border-line p-1 bg-card">
        {[
          { v: "planejado", l: "Planejado (ficha)" },
          { v: "realizado", l: "Realizado (treinos feitos)" },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={visao === o.v}
            onClick={() => go({ visao: o.v })}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium ${
              visao === o.v ? "bg-brand text-brand-contrast" : "text-soft"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>

      {visao === "realizado" && (
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted">Período</span>
            <select
              value={periodo}
              onChange={(e) => go({ periodo: e.target.value, semana: undefined })}
              className={selectCls}
            >
              <option value="semana">Semana</option>
              <option value="4semanas">Últimas 4 semanas</option>
              <option value="personalizado">Escolher datas</option>
            </select>
          </label>
          {periodo === "personalizado" && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="block flex-1 space-y-1">
                <span className="text-xs font-medium text-muted">De</span>
                <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={selectCls} />
              </label>
              <label className="block flex-1 space-y-1">
                <span className="text-xs font-medium text-muted">Até</span>
                <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={selectCls} />
              </label>
              <button type="button" onClick={() => go({ de, ate })} className={`${btnSecondaryCls} !h-10`}>
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Como os grupos secundários contam (configuração do Personal, salva no banco).
export function SecondaryWeightSelect({ value }: { value: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(v: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await setSecondaryWeight(v);
      if (res.error) setError(res.error);
      else router.refresh();
    } catch (err) {
      console.error("setSecondaryWeight:", err);
      setError("Falha de conexão ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-soft">Grupos secundários:</span>
        <select
          value={String(value)}
          disabled={saving}
          onChange={(e) => change(Number(e.target.value))}
          className="h-9 rounded-lg border border-line-strong bg-transparent px-2 text-sm"
        >
          {SECONDARY_WEIGHT_OPTIONS.map((o) => (
            <option key={o.value} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
        {saving && <span className="text-xs text-muted">Salvando...</span>}
      </label>
      {error && <p role="alert" className={errorCls}>{error}</p>}
    </div>
  );
}
