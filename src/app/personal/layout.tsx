import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { unreadCounts } from "@/lib/notification-data";
import { NotificationCountsProvider } from "@/components/notification-badges";
import AppShell, { type NavItem } from "@/components/app-shell";

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("personal");
  const supabase = await createClient();
  const [counts, { count: pendingFeedbacks }] = await Promise.all([
    unreadCounts(supabase, profile.id),
    supabase.from("weekly_checkins").select("id", { count: "exact", head: true }).is("replied_at", null),
  ]);

  const nav: NavItem[] = [
    { label: "Dashboard", href: "/personal", icon: "dashboard" },
    { label: "Alunos", href: "/personal/alunos", icon: "users" },
    {
      label: "Treinos",
      href: "/personal/treinos",
      icon: "dumbbell",
      children: [
        { label: "Meus treinos", href: "/personal/treinos", icon: "list" },
        { label: "Criar treino", href: "/personal/treinos/novo", icon: "plus" },
        { label: "Análise de volume", href: "/personal/treinos/volume", icon: "chart" },
        { label: "Frequência", href: "/personal/frequencia", icon: "calendar" },
      ],
    },
    { label: "Avaliações", href: "/personal/avaliacoes", icon: "ruler" },
    { label: "Feedback", href: "/personal/feedback", icon: "feedback", count: pendingFeedbacks ?? 0 },
    { label: "Mensagens", href: "/personal/mensagens", icon: "messages", messagesDot: true },
    { label: "Biblioteca de exercícios", href: "/personal/exercicios", icon: "library" },
    { label: "Configurações", href: "/personal/configuracoes", icon: "settings" },
  ];

  return (
    <NotificationCountsProvider userId={profile.id} initial={counts}>
      <AppShell
        items={nav}
        userName={profile.full_name}
        roleLabel="Personal Trainer"
        homeHref="/personal"
        notificationsHref="/personal/notificacoes"
      >
        {children}
      </AppShell>
    </NotificationCountsProvider>
  );
}
