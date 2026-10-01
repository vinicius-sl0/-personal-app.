"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setSecondaryWeight } from "@/lib/volume-actions";
import { SECONDARY_WEIGHT_OPTIONS } from "@/lib/volume";
import { btnSecondaryCls, errorCls, inputCls, segBtnCls, segGroupCls } from "@/lib/ui";

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
    <div className={`space-y-3 transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      {/* A escolha principal da tela: o que está na ficha x o que foi feito. */}
      <div role="group" aria-label="Visão" className={segGroupCls}>
        {[
          { v: "planejado", l: "Planejado", d: "na ficha" },
          { v: "realizado", l: "Realizado", d: "treinos feitos" },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={visao === o.v}
            onClick={() => go({ visao: o.v })}
            className={`${segBtnCls(visao === o.v)} flex flex-col items-center !py-2 !text-base leading-tight`}
          >
            {o.l}
            <span className={`font-sans text-xs font-medium ${visao === o.v ? "opacity-75" : "text-muted"}`}>{o.d}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-card p-3 sm:p-4">
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

        {visao === "realizado" && (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            <div role="group" aria-label="Período" className={segGroupCls}>
              {[
                { v: "semana", l: "Semana" },
                { v: "4semanas", l: "4 semanas" },
                { v: "personalizado", l: "Escolher datas" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={periodo === o.v}
                  onClick={() => go({ periodo: o.v, semana: undefined })}
                  className={segBtnCls(periodo === o.v)}
                >
                  {o.l}
                </button>
              ))}
            </div>
            {periodo === "personalizado" && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="block min-w-[8.5rem] flex-1 space-y-1">
                  <span className="text-xs font-medium text-muted">De</span>
                  <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={selectCls} />
                </label>
                <label className="block min-w-[8.5rem] flex-1 space-y-1">
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
          className="h-9 rounded-[10px] border border-field bg-card px-2 text-sm text-ink"
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
