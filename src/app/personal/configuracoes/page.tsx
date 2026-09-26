import Link from "next/link";
import { BarChart3, FileText, LogOut, Palette, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { loadSecondaryWeight } from "@/lib/volume-data";
import { btnSecondaryCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { SecondaryWeightSelect } from "@/components/volume-controls";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const profile = await requireRole("personal");
  const weight = await loadSecondaryWeight(await createClient(), profile.id);

  return (
    <>
      <PageHeader eyebrow="Conta" title="Configurações" />
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

      <form action={signOut} className="mt-6">
        <button type="submit" className={btnSecondaryCls}>
          <LogOut aria-hidden className="size-4" /> Sair da conta
        </button>
      </form>
    </>
  );
}
