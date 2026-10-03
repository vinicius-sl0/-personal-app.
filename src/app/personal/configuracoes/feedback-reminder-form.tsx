"use client";

import { useState } from "react";
import { setFeedbackReminder } from "@/lib/reminder-actions";
import { btnPrimaryCls, errorCls, inputCls, labelCls } from "@/lib/ui";
import { useToast } from "@/components/ui/toast";

const DAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export type ReminderSettings = { enabled: boolean; dow: number; hour: number };

// Configuração do lembrete do Feedback semanal (o envio em si é feito pelo banco, de hora em hora).
export default function FeedbackReminderForm({ initial }: { initial: ReminderSettings }) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = value.enabled !== saved.enabled || value.dow !== saved.dow || value.hour !== saved.hour;
  const dayLabel = DAYS.find((d) => d.value === value.dow)?.label.toLowerCase();

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await setFeedbackReminder(value);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(value);
      toast.success("Lembrete salvo");
    } catch (err) {
      console.error("setFeedbackReminder:", err);
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
          <span className="font-medium">Lembrar os alunos automaticamente</span>
          <span className="block text-muted">Só recebe quem ainda não mandou o Feedback da semana.</span>
        </span>
      </label>

      <div className={`grid grid-cols-2 gap-3 ${value.enabled ? "" : "pointer-events-none opacity-50"}`}>
        <label className="block space-y-1.5">
          <span className={labelCls}>Dia</span>
          <select
            value={value.dow}
            disabled={!value.enabled}
            onChange={(e) => setValue((v) => ({ ...v, dow: Number(e.target.value) }))}
            className={`${inputCls} !h-11`}
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className={labelCls}>Horário</span>
          <select
            value={value.hour}
            disabled={!value.enabled}
            onChange={(e) => setValue((v) => ({ ...v, hour: Number(e.target.value) }))}
            className={`${inputCls} !h-11`}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-soft">
        {value.enabled
          ? `${value.dow >= 6 ? "Todo" : "Toda"} ${dayLabel}, às ${String(value.hour).padStart(2, "0")}h (horário de Brasília), quem não respondeu recebe o aviso no app e no celular.`
          : "Lembrete desligado: ninguém recebe aviso automático."}
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
