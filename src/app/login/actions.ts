"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSession, homeFor } from "@/lib/auth";

export type LoginState = { error?: string };

const schema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  // Mensagem genérica de propósito: não revela se o e-mail existe.
  if (error) return { error: "E-mail ou senha incorretos." };

  const { profile } = await getSession();
  if (!profile) {
    await supabase.auth.signOut();
    return {
      error: "Sua conta ainda não tem acesso liberado. Fale com o seu Personal.",
    };
  }

  redirect(homeFor(profile.role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
