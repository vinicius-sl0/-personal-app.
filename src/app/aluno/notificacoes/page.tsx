import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadNotifications } from "@/lib/notification-data";
import { errorCls } from "@/lib/ui";
import NotificationList from "@/components/notification-list";

export const metadata = { title: "Notificações" };

export default async function NotificacoesAlunoPage() {
  const profile = await requireRole("aluno");
  const { items, error } = await loadNotifications(await createClient(), profile.id, "aluno");

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Notificações</h1>
      {error ? (
        <p className={errorCls}>Não foi possível carregar os avisos: {error}</p>
      ) : (
        <NotificationList items={items} openBase="/aluno/notificacoes/abrir" />
      )}
    </section>
  );
}
