"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSession, homeFor } from "@/lib/auth";
import { getSiteUrl } from "@/lib/invite";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  redirectTo?: string; // login ok: a tela mostra "Login realizado" e navega
};

const schema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "email" | "password";
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  // Mensagem genérica de propósito: não revela se o e-mail existe.
  if (error) return { error: "E-mail ou senha incorretos." };

  const { profile } = await getSession();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Sua conta ainda não tem acesso liberado. Fale com o seu Personal." };
  }

  // PERSONAL → dashboard do Personal · ALUNO → dashboard do aluno
  return { redirectTo: homeFor(profile.role) };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------
// Recuperação de senha (Supabase Auth envia o e-mail com o link)
// ---------------------------------------------------------------------
export type ResetState = { error?: string; sent?: boolean };

export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = z.email("Informe um e-mail válido.").safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const site = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${site}/auth/confirm?next=/redefinir-senha`,
  });
  if (error?.status === 429) return { error: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." };
  if (error) console.error("requestPasswordReset:", error.message);

  // Sempre a mesma resposta: não revela se o e-mail tem cadastro.
  return { sent: true };
}

export type NewPasswordState = { error?: string; redirectTo?: string };

const passwordSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72, "Senha muito longa."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As duas senhas não são iguais.", path: ["confirm"] });

export async function updatePassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const parsed = passwordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "O link expirou. Peça um novo em “Esqueci minha senha”." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { error: "A nova senha precisa ser diferente da anterior." };
    return { error: "Não foi possível trocar a senha: " + error.message };
  }

  const { profile } = await getSession();
  return { redirectTo: profile ? homeFor(profile.role) : "/login" };
}
