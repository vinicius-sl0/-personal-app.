"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  Home,
  LayoutDashboard,
  Library,
  LineChart,
  LogOut,
  Menu,
  MessageSquareText,
  MessagesSquare,
  PlusCircle,
  Ruler,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import { BRAND } from "@/lib/brand";
import { Avatar } from "@/components/ui/avatar";
import { MessagesDot, NotificationBell } from "@/components/notification-badges";

// Ícones por nome (o layout do servidor não pode passar componentes para cá).
const ICONS = {
  dashboard: LayoutDashboard,
  home: Home,
  users: Users,
  dumbbell: Dumbbell,
  list: ClipboardList,
  plus: PlusCircle,
  library: Library,
  chart: BarChart3,
  calendar: CalendarCheck,
  ruler: Ruler,
  feedback: MessageSquareText,
  messages: MessagesSquare,
  settings: Settings,
  evolution: LineChart,
  user: User,
} as const;

export type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof ICONS;
  count?: number; // número de pendências (ex.: feedbacks sem resposta)
  messagesDot?: boolean; // bolinha de mensagem não lida (tempo real)
  children?: NavItem[];
};

// O item ativo é o de endereço mais longo que combina com a página atual.
function activeHref(pathname: string, items: NavItem[]) {
  const all = items.flatMap((i) => [i, ...(i.children ?? [])]).map((i) => i.href);
  return all
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .sort((a, b) => b.length - a.length)[0];
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeHref(pathname, items);

  const link = (item: NavItem, child = false) => {
    const Icon = ICONS[item.icon];
    const on = item.href === active;
    return (
      <Link
        key={`${item.href}-${item.label}`}
        href={item.href}
        onClick={onNavigate}
        aria-current={on ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3 font-medium transition ${
          child ? "h-9 text-[13px]" : "h-11 text-sm"
        } ${on ? "bg-brand-soft text-ink" : "text-soft hover:bg-subtle hover:text-ink"}`}
      >
        {on && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand" />}
        <Icon aria-hidden className={`${child ? "size-4" : "size-[18px]"} shrink-0 ${on ? "text-brand-ink" : ""}`} />
        <span className="flex-1 truncate">{item.label}</span>
        {!!item.count && (
          <span className="rounded-full bg-brand px-1.5 text-[11px] font-bold leading-5 text-brand-contrast" aria-label={`${item.count} pendente(s)`}>
            {item.count}
          </span>
        )}
        {item.messagesDot && <MessagesDot />}
      </Link>
    );
  };

  return (
    <nav aria-label="Menu principal" className="space-y-1">
      {items.map((item) =>
        item.children ? (
          <div key={item.label} className="space-y-1 pt-1">
            <p className="flex items-center gap-3 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {(() => {
                const Icon = ICONS[item.icon];
                return <Icon aria-hidden className="size-4" />;
              })()}
              {item.label}
            </p>
            <div className="ml-4 space-y-0.5 border-l border-line pl-2">{item.children.map((c) => link(c, true))}</div>
          </div>
        ) : (
          link(item)
        ),
      )}
    </nav>
  );
}

function SidebarContent({
  items,
  userName,
  roleLabel,
  homeHref,
  onNavigate,
}: {
  items: NavItem[];
  userName: string;
  roleLabel: string;
  homeHref: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link href={homeHref} onClick={onNavigate} className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-brand text-brand-contrast">
          <Dumbbell className="size-5" />
        </span>
        <span className="text-[15px] font-bold leading-tight tracking-tight">{BRAND.name}</span>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <NavList items={items} onNavigate={onNavigate} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted">{roleLabel}</p>
          </div>
          <form action={signOut}>
            <button type="submit" aria-label="Sair" title="Sair" className="rounded-lg p-2 text-muted transition hover:bg-subtle hover:text-ink">
              <LogOut aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({
  items,
  userName,
  roleLabel,
  homeHref,
  notificationsHref,
  children,
}: {
  items: NavItem[];
  userName: string;
  roleLabel: string;
  homeHref: string;
  notificationsHref: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o menu do celular ao trocar de página e com a tecla Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebar = { items, userName, roleLabel, homeHref };

  return (
    <div className="min-h-dvh">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-contrast">
        Pular para o conteúdo
      </a>

      {/* Computador: menu lateral fixo, sempre escuro (identidade). */}
      <aside className="theme-dark fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-surface lg:block">
        <SidebarContent {...sidebar} />
      </aside>

      {/* Celular/tablet: barra do topo. */}
      <header className="theme-dark sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-xl text-ink hover:bg-subtle"
        >
          <Menu aria-hidden className="size-5" />
        </button>
        <Link href={homeHref} className="flex min-w-0 flex-1 items-center gap-2">
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-brand text-brand-contrast">
            <Dumbbell className="size-4" />
          </span>
          <span className="truncate text-sm font-bold">{BRAND.name}</span>
        </Link>
        <NotificationBell href={notificationsHref} />
      </header>

      {/* Celular/tablet: menu deslizante. */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
          />
          <div className="theme-dark absolute inset-y-0 left-0 w-[82%] max-w-xs animate-slide-in-left border-r border-line bg-surface">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-5 z-10 grid size-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
            >
              <X aria-hidden className="size-5" />
            </button>
            <SidebarContent {...sidebar} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Computador: barra fina no topo com o sino. */}
        <div className="sticky top-0 z-20 hidden h-14 items-center justify-end gap-2 border-b border-line bg-surface/85 px-8 backdrop-blur lg:flex">
          <NotificationBell href={notificationsHref} />
        </div>
        <main id="conteudo" key={pathname} className="mx-auto w-full max-w-6xl animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
