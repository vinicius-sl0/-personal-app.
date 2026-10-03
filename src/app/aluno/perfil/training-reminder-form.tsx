"use client";

import { useState } from "react";
import { setTrainingReminder } from "@/lib/reminder-actions";
import { btnPrimaryCls, errorCls, inputCls, labelCls } from "@/lib/ui";
import { useToast } from "@/components/ui/toast";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

// Lembrete "Hoje é dia de treino": o aluno liga/desliga e escolhe a hora (envio feito pelo banco).
export default function TrainingReminderForm({
  initial,
  daysText,
  hasDays,
}: {
  initial: { enabled: boolean; hour: number };
  daysText: string; // ex.: "Seg, Qua, Sex"
  hasDays: boolean;
}) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = value.enabled !== saved.enabled || value.hour !== saved.hour;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await setTrainingReminder(value);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(value);
      toast.success("Lembrete salvo");
    } catch (err) {
      console.error("setTrainingReminder:", err);
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
          <span className="font-medium">Me lembrar nos dias de treino</span>
          <span className="block text-muted">Só se você ainda não tiver feito o check-in no dia.</span>
        </span>
      </label>

      <label className={`block max-w-40 space-y-1.5 ${value.enabled ? "" : "pointer-events-none opacity-50"}`}>
        <span className={labelCls}>Horário</span>
        <select
          value={value.hour}
          disabled={!value.enabled}
          onChange={(e) => setValue((v) => ({ ...v, hour: Number(e.target.value) }))}
          className={`${inputCls} !h-11`}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {hh(h)}
            </option>
          ))}
        </select>
      </label>

      <p className="text-sm text-soft">
        {!hasDays
          ? "Seu Personal ainda não combinou os dias de treino com você. O lembrete começa quando eles forem definidos."
          : value.enabled
            ? `Nos seus dias de treino (${daysText}), às ${hh(value.hour)}, você recebe o aviso no app e no celular.`
            : "Lembrete desligado."}
      </p>

      {error && (
        <p role="alert" className={errorCls}>
          {error}
        </p>
      )}

      {changed && (
        <button type="button" onClick={save} disabled={saving} className={`${btnPrimaryCls} !h-11 !w-auto px-5 text-sm`}>
          {saving ? "Salvando..." : "Salvar lembrete"}
        </button>
      )}
    </div>
  );
}
