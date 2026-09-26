import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { loadNotifications } from "@/lib/notification-data";
import { errorCls } from "@/lib/ui";
import NotificationList from "@/components/notification-list";

export const metadata = { title: "Notificações" };

export default async function NotificacoesPersonalPage() {
  const profile = await requireRole("personal");
  const { items, error } = await loadNotifications(await createClient(), profile.id, "personal");

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Notificações</h1>
      {error ? (
        <p className={errorCls}>Não foi possível carregar os avisos: {error}</p>
      ) : (
        <NotificationList items={items} openBase="/personal/notificacoes/abrir" />
      )}
    </section>
  );
}
