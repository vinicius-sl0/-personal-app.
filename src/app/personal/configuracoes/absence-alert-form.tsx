"use client";

import { useState } from "react";
import { setAbsenceAlert } from "@/lib/reminder-actions";
import { btnPrimaryCls, errorCls, inputCls, labelCls } from "@/lib/ui";
import { useToast } from "@/components/ui/toast";

const OPTIONS = [1, 2, 3, 4, 5];

// Aviso de faltas seguidas (envio feito pelo banco, todo dia às 9h).
export default function AbsenceAlertForm({ initial }: { initial: { enabled: boolean; days: number } }) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = value.enabled !== saved.enabled || value.days !== saved.days;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await setAbsenceAlert(value);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(value);
      toast.success("Aviso salvo");
    } catch (err) {
      console.error("setAbsenceAlert:", err);
      setError("Falha de conexão ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => setValue((v) => ({ ...v, enabled: e.target.checked }))}
          className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
        />
        <span className="text-sm">
          <span className="font-medium">Me avisar quando um aluno faltar</span>
          <span className="block text-muted">Conta só os dias de treino combinados com cada aluno.</span>
        </span>
      </label>

      <label className={`block max-w-56 space-y-1.5 ${value.enabled ? "" : "pointer-events-none opacity-50"}`}>
        <span className={labelCls}>Avisar depois de</span>
        <select
          value={value.days}
          disabled={!value.enabled}
          onChange={(e) => setValue((v) => ({ ...v, days: Number(e.target.value) }))}
          className={`${inputCls} !h-11`}
        >
          {OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "1 falta" : `${n} faltas seguidas`}
            </option>
          ))}
        </select>
      </label>

      <p className="text-sm text-soft">
        {value.enabled
          ? `Todo dia às 9h, o app confere a frequência. Quem chegar a ${value.days === 1 ? "1 falta" : `${value.days} faltas seguidas`} gera um aviso para você (um por sequência, sem repetir).`
          : "Aviso de faltas desligado."}
      </p>

      {error && (
        <p role="alert" className={errorCls}>
          {error}
        </p>
      )}

      {changed && (
        <button type="button" onClick={save} disabled={saving} className={`${btnPrimaryCls} !h-11 !w-auto px-5 text-sm`}>
          {saving ? "Salvando..." : "Salvar aviso"}
        </button>
      )}
    </div>
  );
}
