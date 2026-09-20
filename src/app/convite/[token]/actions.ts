"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getValidInvite } from "@/lib/invite";
import { parseConsents, recordConsents } from "@/lib/consents";
import { isMinor } from "@/lib/utils";

export type AcceptState = { error?: string };

export async function acceptInvite(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  const invite = await getValidInvite(token);
  if (!invite) {
    return { error: "Este convite é inválido ou expirou. Peça um novo link ao seu Personal." };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (password !== confirm) return { error: "As senhas não conferem." };

  const consents = parseConsents(formData, isMinor(invite.student.birth_date));
  if (!consents.ok) return { error: consents.error };

  // 1) Cria a conta pelo servidor. O papel vem em app_metadata (só o servidor consegue definir).
  //    O trigger do banco valida convite + e-mail, cria o perfil e vincula o aluno.
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email: invite.student.email,
    password,
    email_confirm: true,
    app_metadata: { role: "aluno", student_id: invite.student.id },
  });

  if (createError) {
    console.error("acceptInvite/createUser:", createError.message);
    return { error: "Não foi possível criar sua conta. Peça um novo convite ao seu Personal." };
  }

  // 2) Entra com a conta recém-criada.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invite.student.email,
    password,
  });
  if (signInError) redirect("/login");

  // 3) Registra os consentimentos com a sessão do próprio aluno (o banco o ativa).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await recordConsents(supabase, user.id, invite.student.id, consents.types);
  }

  // Se algum consentimento falhou, /aluno mostra a tela para concluir o aceite.
  redirect("/aluno");
}
