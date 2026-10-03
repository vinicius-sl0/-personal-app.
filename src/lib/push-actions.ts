"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getSession, homeFor } from "@/lib/auth";
import { sendToSubscriptions } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

type Result = { ok?: boolean; error?: string };

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  p256dh: z.string().min(20).max(200),
  auth: z.string().min(10).max(100),
});

// Grava a inscrição DESTE aparelho para a pessoa logada (a função do banco também passa para
// ela uma inscrição que estava em outra conta — celular compartilhado).
export async function savePushSubscription(input: unknown): Promise<Result> {
  const { profile } = await getSession();
  if (!profile) return { error: "Entre na sua conta para ativar os avisos." };
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: "O navegador devolveu uma inscrição inválida. Tente de novo." };

  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.p256dh,
    p_auth: parsed.data.auth,
    p_user_agent: userAgent ?? undefined,
  });
  if (error) return { error: "Não foi possível ativar os avisos: " + error.message };
  return { ok: true };
}

// Remove a inscrição deste aparelho (desativar, ou antes de sair da conta).
export async function removePushSubscription(endpoint: string): Promise<Result> {
  const { profile } = await getSession();
  if (!profile) return { ok: true }; // já saiu: a RLS não deixaria apagar mesmo
  const parsed = z.url().max(1000).safeParse(endpoint);
  if (!parsed.success) return { error: "Aparelho inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data);
  if (error) return { error: "Não foi possível desativar os avisos: " + error.message };
  return { ok: true };
}

// "Enviar aviso de teste": manda só para os aparelhos da própria pessoa. Lê as inscrições com a
// sessão dela (a RLS só devolve as próprias) — não precisa da chave admin.
export async function sendTestPush(): Promise<Result & { sent?: number }> {
  const { profile } = await getSession();
  if (!profile) return { error: "Entre na sua conta para testar os avisos." };

  const supabase = await createClient();
  const { data: subs, error } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth_key");
  if (error) return { error: "Não foi possível ler seus aparelhos: " + error.message };
  if (!subs?.length) return { error: "Nenhum aparelho com avisos ativados nesta conta." };

  try {
    const res = await sendToSubscriptions(subs, {
      title: "Aviso de teste",
      body: "Se você está vendo isto, os avisos no celular estão funcionando.",
      url: homeFor(profile.role),
      tag: "teste",
    });
    if (res.gone.length) await supabase.from("push_subscriptions").delete().in("id", res.gone);
    if (res.sent === 0) {
      return {
        error: res.errors.length
          ? "O serviço de avisos recusou o envio: " + res.errors[0]
          : "Este aparelho cancelou a inscrição. Desative e ative os avisos de novo.",
      };
    }
    return { ok: true, sent: res.sent };
  } catch (err) {
    return { error: "Não foi possível enviar: " + (err as Error).message };
  }
}
