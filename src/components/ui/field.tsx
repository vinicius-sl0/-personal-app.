"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { inputCls, labelCls } from "@/lib/ui";

// Campo de formulário com rótulo, dica e erro ligados ao input (acessível a leitores de tela).
export function Field({
  label,
  error,
  hint,
  type = "text",
  ...props
}: {
  label: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error ? `${id}-erro` : null, hint ? `${id}-dica` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputCls} ${isPassword ? "pr-12" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Esconder senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-lg text-muted hover:text-ink"
          >
            {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-dica`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return <Loader2 aria-hidden className={`${className} animate-spin`} />;
}
