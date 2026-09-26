import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { unreadCounts } from "@/lib/notification-data";
import { NotificationCountsProvider } from "@/components/notification-badges";
import AppShell, { type NavItem } from "@/components/app-shell";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("aluno");
  const counts = await unreadCounts(await createClient(), profile.id);

  const nav: NavItem[] = [
    { label: "Início", href: "/aluno", icon: "home" },
    { label: "Meu treino", href: "/aluno/treinos", icon: "dumbbell" },
    { label: "Avaliação", href: "/aluno/avaliacoes", icon: "ruler" },
    { label: "Evolução", href: "/aluno/evolucao", icon: "evolution" },
    { label: "Feedback semanal", href: "/aluno/feedback", icon: "feedback" },
    { label: "Mensagens", href: "/aluno/mensagens", icon: "messages", messagesDot: true },
    { label: "Perfil", href: "/aluno/perfil", icon: "user" },
  ];

  return (
    <NotificationCountsProvider userId={profile.id} initial={counts}>
      <AppShell
        items={nav}
        userName={profile.full_name}
        roleLabel="Aluno"
        homeHref="/aluno"
        notificationsHref="/aluno/notificacoes"
      >
        {children}
      </AppShell>
    </NotificationCountsProvider>
  );
}
