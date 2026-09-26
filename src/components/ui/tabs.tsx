import Link from "next/link";

// Abas por link (o endereço guarda a aba escolhida — dá para voltar/compartilhar).
export function LinkTabs({
  tabs,
  active,
  label,
}: {
  tabs: { key: string; label: React.ReactNode; href: string }[];
  active: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
              on ? "bg-brand text-brand-contrast shadow-sm" : "text-soft hover:bg-subtle hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
