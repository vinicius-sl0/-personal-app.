"use client";

import { useActionState, useMemo, useState } from "react";
import { btnPrimaryCls, btnSecondaryCls, errorCls, inputCls } from "@/lib/ui";
import {
  computeCalculated,
  formatDate,
  formatValue,
  FORMULA_HINT,
  groupByCategory,
  todayIso,
  type Metric,
  type Protocol,
} from "@/lib/assessment";
import type { AssessmentFormState } from "./actions";
import { assessmentSchema } from "./schema";

export type AssessmentInitial = {
  assessed_at: string;
  protocol_id: string | null;
  method: string | null;
  device: string | null;
  notes: string | null;
  // Valores já digitados, como texto (ex.: "78,4"), indexados pelo id da métrica.
  inputs: Record<string, string>;
};

// Aceita vírgula ou ponto como separador decimal ("78,4" ou "78.4").
function parseNumber(raw: string) {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export default function AssessmentForm({
  metrics,
  protocols,
  action,
  initial,
  previous,
  prefill,
}: {
  metrics: Metric[];
  protocols: Protocol[];
  action: (prev: AssessmentFormState, fd: FormData) => Promise<AssessmentFormState>;
  // Avaliação existente (tela de edição).
  initial?: AssessmentInitial;
  // Último valor de cada métrica em avaliações anteriores (para referência ao digitar).
  previous?: Record<string, { value: number; date: string }>;
  // Valores sugeridos para uma avaliação nova (ex.: a última altura medida).
  prefill?: Record<string, string>;
}) {
  const defaultProtocol = initial
    ? (initial.protocol_id ?? "")
    : (protocols.find((p) => p.name === "Antropometria básica")?.id ?? protocols[0]?.id ?? "");

  const [assessedAt, setAssessedAt] = useState(initial?.assessed_at ?? todayIso());
  const [protocolId, setProtocolId] = useState<string>(defaultProtocol);
  const [showAll, setShowAll] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>(initial?.inputs ?? prefill ?? {});
  const [method, setMethod] = useState(initial?.method ?? "");
  const [device, setDevice] = useState(initial?.device ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [clientError, setClientError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState(action, {} as AssessmentFormState);

  const protocol = protocols.find((p) => p.id === protocolId);

  // Mostra as medidas do tipo de avaliação escolhido + qualquer medida já preenchida.
  const visible = useMemo(() => {
    if (showAll || !protocol) return metrics;
    const ids = new Set(protocol.metric_ids);
    for (const [id, v] of Object.entries(inputs)) if (v.trim() !== "") ids.add(id);
    return metrics.filter((m) => ids.has(m.id));
  }, [metrics, protocol, showAll, inputs]);

  const numericValues = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of metrics) {
      if (m.is_calculated || m.value_type !== "numeric") continue;
      const n = parseNumber(inputs[m.id] ?? "");
      if (n !== null && !Number.isNaN(n)) out[m.id] = n;
    }
    return out;
  }, [metrics, inputs]);

  const calculated = useMemo(() => computeCalculated(metrics, numericValues), [metrics, numericValues]);

  function buildPayload() {
    const values: { metric_id: string; value_numeric: number | null; value_text: string | null }[] = [];
    for (const m of metrics) {
      if (m.is_calculated) continue;
      const raw = (inputs[m.id] ?? "").trim();
      if (raw === "") continue;
      if (m.value_type === "text") {
        values.push({ metric_id: m.id, value_numeric: null, value_text: raw });
      } else {
        const n = parseNumber(raw);
        if (n === null || Number.isNaN(n)) {
          return { error: `${m.label}: “${raw}” não é um número válido.` } as const;
        }
        values.push({ metric_id: m.id, value_numeric: n, value_text: null });
      }
    }
    return {
      payload: {
        assessed_at: assessedAt,
        protocol_id: protocolId || null,
        method: method.trim() || null,
        device: device.trim() || null,
        notes: notes.trim() || null,
        values,
      },
    } as const;
  }

  function validateClient() {
    const built = buildPayload();
    if ("error" in built) {
      setClientError(built.error ?? "Confira os valores.");
      return null;
    }
    const parsed = assessmentSchema.safeParse(built.payload);
    if (!parsed.success) {
      setClientError(parsed.error.issues[0]?.message ?? "Confira os campos da avaliação.");
      return null;
    }
    if (assessedAt > todayIso()) {
      setClientError("A data da avaliação não pode estar no futuro.");
      return null;
    }
    setClientError(null);
    return JSON.stringify(parsed.data);
  }

  const groups = groupByCategory(visible);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="assessed_at" className="text-sm font-medium">
            Data da avaliação
          </label>
          <input
            id="assessed_at"
            type="date"
            value={assessedAt}
            max={todayIso()}
            onChange={(e) => setAssessedAt(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="protocol" className="text-sm font-medium">
            Tipo de avaliação
          </label>
          <select
            id="protocol"
            value={protocolId}
            onChange={(e) => setProtocolId(e.target.value)}
            className={inputCls}
          >
            {protocols.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="">Todas as medidas</option>
          </select>
          {protocol?.description && <p className="text-xs text-muted">{protocol.description}</p>}
        </div>
      </div>

      <p className="text-sm text-muted">
        Preencha só o que foi medido. Campos em branco são ignorados. Use vírgula ou ponto para
        decimais.
      </p>

      {groups.map((g) => (
        <fieldset key={g.category} className="space-y-3 rounded-xl border border-line p-4 bg-card">
          <legend className="px-1 font-semibold">{g.label}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.metrics.map((m) => {
              const prev = previous?.[m.id];
              if (m.is_calculated) {
                const v = calculated[m.id];
                return (
                  <div key={m.id} className="space-y-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="flex h-12 items-center rounded-lg bg-zinc-100 px-3 text-base dark:bg-zinc-900">
                      {v !== undefined ? formatValue(v, m) : "—"}
                    </p>
                    <p className="text-xs text-muted">
                      {m.formula_key ? FORMULA_HINT[m.formula_key] : "Calculado automaticamente."}
                    </p>
                  </div>
                );
              }
              const raw = inputs[m.id] ?? "";
              const n = parseNumber(raw);
              const invalid = m.value_type === "numeric" && Number.isNaN(n);
              return (
                <div key={m.id} className="space-y-1">
                  <label htmlFor={`m_${m.id}`} className="text-sm font-medium">
                    {m.label}
                    {m.unit && <span className="font-normal text-muted"> ({m.unit})</span>}
                  </label>
                  <input
                    id={`m_${m.id}`}
                    type="text"
                    inputMode={m.value_type === "numeric" ? "decimal" : "text"}
                    autoComplete="off"
                    value={raw}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    aria-invalid={invalid || undefined}
                    className={`${inputCls} ${invalid ? "!border-red-500" : ""}`}
                  />
                  {invalid ? (
                    <p className="text-xs text-red-600 dark:text-red-400">Digite só números.</p>
                  ) : (
                    prev && (
                      <p className="text-xs text-muted">
                        Última: {formatValue(prev.value, m)} em {formatDate(prev.date)}
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      {protocol && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className={`${btnSecondaryCls} w-full`}>
          {showAll ? "Mostrar só as medidas deste tipo de avaliação" : "+ Mostrar todas as medidas"}
        </button>
      )}

      <details className="rounded-xl border border-line p-4 bg-card">
        <summary className="cursor-pointer font-semibold">Observações (opcional)</summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <label htmlFor="method" className="text-sm font-medium">
              Método
            </label>
            <input
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Ex.: Pollock 7 dobras, bioimpedância"
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="device" className="text-sm font-medium">
              Aparelho
            </label>
            <input
              id="device"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              placeholder="Ex.: adipômetro Cescorf, balança InBody"
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium">
              Anotações
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputCls} h-auto py-2`}
            />
            <p className="text-xs text-muted">O aluno também verá estas anotações.</p>
          </div>
        </div>
      </details>

      {(clientError || state.error) && (
        <p role="alert" className={errorCls}>
          {clientError ?? state.error}
        </p>
      )}

      <form
        action={(fd) => {
          const payload = validateClient();
          if (!payload) return;
          fd.set("payload", payload);
          formAction(fd);
        }}
      >
        <button type="submit" disabled={pending} className={btnPrimaryCls}>
          {pending ? "Salvando..." : "Salvar avaliação"}
        </button>
      </form>
    </div>
  );
}
