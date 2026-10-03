import Link from "next/link";
import { AlarmClock, Camera, FileText, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { hasPhotoConsent } from "@/lib/photo-data";
import { formatDate } from "@/lib/assessment";
import { trainingDaysText } from "@/lib/attendance";
import { btnSecondaryCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ConsentToggle from "@/components/photo-consent-toggle";
import TrainingReminderForm from "./training-reminder-form";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const profile = await requireRole("aluno");
  const supabase = await createClient();
  // A RLS devolve apenas o cadastro do próprio aluno.
  const { data: student } = await supabase
    .from("students")
    .select("id, goal, start_date, training_days, phone")
    .maybeSingle();
  const [consent, { data: prefs }] = await Promise.all([
    student ? hasPhotoConsent(supabase, student.id) : Promise.resolve({ active: false, error: null }),
    supabase.from("profiles").select("training_reminder_enabled, training_reminder_hour").eq("id", profile.id).maybeSingle(),
  ]);

  return (
    <>
      <PageHeader title="Perfil" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={profile.full_name} size="lg" ring />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{profile.full_name}</p>
              <p className="truncate text-sm text-muted">{profile.email}</p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Objetivo</dt>
              <dd className="font-medium">{student?.goal ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Aluno desde</dt>
              <dd className="font-medium">{student ? formatDate(student.start_date) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Dias de treino combinados</dt>
              <dd className="font-medium">{trainingDaysText(student?.training_days ?? [])}</dd>
            </div>
            <div>
              <dt className="text-muted">Telefone</dt>
              <dd className="font-medium">{student?.phone ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">Para corrigir algum dado, fale com o seu Personal.</p>
        </Card>

        <Card>
          <CardHeader
            icon={<AlarmClock className="size-4" />}
            title="Lembrete de treino"
            description="Um aviso nos seus dias de treino, caso você ainda não tenha treinado."
          />
          <TrainingReminderForm
            initial={{ enabled: prefs?.training_reminder_enabled ?? true, hour: prefs?.training_reminder_hour ?? 17 }}
            daysText={trainingDaysText(student?.training_days ?? [])}
            hasDays={(student?.training_days ?? []).length > 0}
          />
        </Card>

        <Card>
          <CardHeader
            icon={<Camera className="size-4" />}
            title="Fotos de progresso"
            description="Com a autorização, seu Personal pode ver e enviar suas fotos de evolução."
            action={consent.active ? <Badge tone="success" dot>Autorizado</Badge> : <Badge tone="neutral">Não autorizado</Badge>}
          />
          <ConsentToggle active={consent.active} />
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

        <Card>
          <CardHeader icon={<UserRound className="size-4" />} title="Sessão" description="Sair deste aparelho." />
          <SignOutButton variant="full" />
        </Card>
      </div>
    </>
  );
}
