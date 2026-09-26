"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

// Avisos rápidos ("Salvo!", "Erro ao enviar"). Aparecem no canto e somem sozinhos.
// Uso: const toast = useToast(); toast.success("Treino salvo");
type Tone = "success" | "error" | "info";
type Item = { id: number; tone: Tone; message: string };

const ToastContext = createContext<{ show: (tone: Tone, message: string) => void } | null>(null);

const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };
const TONE_CLS = {
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-brand-ink",
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId++;
      setItems((prev) => [...prev.slice(-2), { id, tone, message }]);
      // erros ficam mais tempo na tela
      setTimeout(() => dismiss(id), tone === "error" ? 7000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
      >
        {items.map((t) => {
          const Icon = ICON[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border border-line-strong bg-card p-3.5 text-sm shadow-[0_18px_40px_-18px_rgb(0_0_0/0.6)]"
            >
              <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${TONE_CLS[t.tone]}`} />
              <p className="flex-1 text-ink">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar aviso"
                className="rounded-md p-0.5 text-muted hover:text-ink"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return {
    success: (m: string) => ctx?.show("success", m),
    error: (m: string) => ctx?.show("error", m),
    info: (m: string) => ctx?.show("info", m),
  };
}
