import { AlertTriangle, Inbox } from "lucide-react";
import { cardCls } from "@/lib/ui";

// Estado VAZIO: explica o que falta e (opcional) oferece a próxima ação.
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
      <span aria-hidden className="mb-3 grid size-11 place-items-center rounded-2xl bg-subtle text-muted">
        {icon ?? <Inbox className="size-5" />}
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Estado de ERRO: mensagem literal do problema, sempre visível.
export function ErrorState({ title = "Algo deu errado", message }: { title?: string; message: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
      <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
      <div>
        <p className="font-medium text-red-800 dark:text-red-300">{title}</p>
        <p className="mt-0.5 text-red-700 dark:text-red-300/90">{message}</p>
      </div>
    </div>
  );
}

// Estado de CARREGANDO: blocos pulsando no formato do conteúdo.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-subtle-strong ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Carregando" className="space-y-5">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${cardCls} space-y-3 p-5`}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className={`${cardCls} space-y-3 p-5`}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
