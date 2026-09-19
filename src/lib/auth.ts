import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "personal" | "aluno";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  email: string;
};

// Sessão atual: valida o usuário no servidor do Supabase (getUser) e busca o perfil.
// Usuário autenticado SEM perfil = sem acesso a nada.
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (data as Profile | null) ?? null };
}

export function homeFor(role: Role) {
  return role === "personal" ? "/personal" : "/aluno";
}

// Guarda de papel para os layouts. Sem sessão -> /login; papel errado -> área correta.
export async function requireRole(role: Role) {
  const { user, profile } = await getSession();
  if (!user || !profile) redirect("/login");
  if (profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}
