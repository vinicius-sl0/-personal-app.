import Link from "next/link";
import { BarChart3, BellRing, CalendarX, FileText, Palette, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { loadSecondaryWeight } from "@/lib/volume-data";
import { btnSecondaryCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { SecondaryWeightSelect } from "@/components/volume-controls";
import FeedbackReminderForm from "./feedback-reminder-form";
import AbsenceAlertForm from "./absence-alert-form";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const profile = await requireRole("personal");
  const supabase = await createClient();
  const [weight, { data: reminder }] = await Promise.all([
    loadSecondaryWeight(supabase, profile.id),
    supabase
      .from("personal_profiles")
      .select("feedback_reminder_enabled, feedback_reminder_dow, feedback_reminder_hour, absence_alert_enabled, absence_alert_days")
      .eq("profile_id", profile.id)
      .maybeSingle(),
  ]);

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<UserRound className="size-4" />} title="Seu perfil" />
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted">Nome</dt>
              <dd className="font-medium">{profile.full_name}</dd>
            </div>
            <div>
              <dt className="text-muted">E-mail de acesso</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader
            icon={<BarChart3 className="size-4" />}
            title="Análise de volume"
            description="Quanto uma série conta para os grupos musculares secundários do exercício."
          />
          <SecondaryWeightSelect value={weight} />
        </Card>

        <Card>
          <CardHeader
            icon={<BellRing className="size-4" />}
            title="Lembrete do Feedback semanal"
            description="Aviso automático para os alunos que ainda não responderam a semana."
          />
          <FeedbackReminderForm
            initial={{
              enabled: reminder?.feedback_reminder_enabled ?? true,
              dow: reminder?.feedback_reminder_dow ?? 5,
              hour: reminder?.feedback_reminder_hour ?? 18,
            }}
          />
        </Card>

        <Card>
          <CardHeader
            icon={<CalendarX className="size-4" />}
            title="Aviso de faltas"
            description="Saiba quando um aluno falta a dias de treino combinados seguidos."
          />
          <AbsenceAlertForm
            initial={{ enabled: reminder?.absence_alert_enabled ?? true, days: reminder?.absence_alert_days ?? 2 }}
          />
        </Card>

        <Card>
          <CardHeader
            icon={<Palette className="size-4" />}
            title="Aparência"
            description="O app usa a identidade preto e laranja e acompanha o modo claro/escuro do aparelho."
          />
          <p className="text-sm text-muted">Para trocar entre claro e escuro, mude o tema do celular ou do computador.</p>
        </Card>

        <Card>
          <CardHeader icon={<FileText className="size-4" />} title="Documentos" />
          <div className="flex flex-wrap gap-2">
            <Link href="/termos" className={btnSecondaryCls}>
              Termos de uso
            </Link>
            <Link href="/privacidade" className={btnSecondaryCls}>
              Política de privacidade
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SignOutButton variant="full" />
      </div>
    </>
  );
}
