import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { btnPrimaryCls } from "@/lib/ui";
import { PageHeader } from "@/components/ui/page-header";
import { ListLink } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, ErrorState } from "@/components/ui/states";

export const metadata = { title: "Criar treino" };

// Passo 1 de "Criar treino": escolher o aluno. O editor da ficha é o mesmo de sempre.
export default async function CriarTreinoPage() {
  await requireRole("personal");
  const supabase = await createClient();
  const { data: students, error } = await supabase
    .from("students")
    .select("id, full_name, goal, status")
    .neq("status", "arquivado")
    .order("full_name");

  return (
    <>
      <PageHeader
        eyebrow="Treinos"
        title="Criar treino"
        description="Para quem é esta ficha? Escolha o aluno para abrir o editor."
        back={{ href: "/personal/treinos", label: "Meus treinos" }}
      />

      {error && <ErrorState message={`Não foi possível carregar os alunos: ${error.message}`} />}

      {!error && students?.length === 0 && (
        <EmptyState
          icon={<UserPlus className="size-5" />}
          title="Você ainda não tem alunos"
          description="Cadastre um aluno para montar a primeira ficha."
          action={
            <Link href="/personal/alunos/novo" className={`${btnPrimaryCls} !h-11 !w-auto px-5 text-sm`}>
              Cadastrar aluno
            </Link>
          }
        />
      )}

      <ul className="grid gap-2 md:grid-cols-2">
        {students?.map((s) => (
          <li key={s.id}>
            <ListLink href={`/personal/alunos/${s.id}/treinos/novo`}>
              <span className="flex items-center gap-3">
                <Avatar name={s.full_name} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{s.full_name}</span>
                  <span className="block truncate text-sm text-muted">{s.goal ?? "Objetivo não informado"}</span>
                </span>
              </span>
            </ListLink>
          </li>
        ))}
      </ul>
    </>
  );
}
