import { headers } from "next/headers";
import type { Database } from "@/types/database.types";
import type { createClient } from "@/lib/supabase/server";

export type ConsentType = Database["public"]["Enums"]["consent_type"];

// Ao alterar o texto dos termos/política, mude a versão: o novo aceite fica registrado à parte.
export const CONSENT_VERSION = "2026-09-v1";

export function parseConsents(formData: FormData, minor: boolean) {
  const has = (k: string) => formData.get(k) === "on";

  const required: ConsentType[] = ["termos_uso", "politica_privacidade", "dados_saude"];
  if (minor) required.push("responsavel_legal");

  if (!required.every(has)) {
    return {
      ok: false,
      error: "Para continuar, marque todos os consentimentos obrigatórios.",
    } as const;
  }

  const types: ConsentType[] = [...required];
  if (has("fotos_evolucao")) types.push("fotos_evolucao");

  return { ok: true, types } as const;
}

function firstIp(value: string | null) {
  const first = value?.split(",")[0]?.trim();
  return first && /^[0-9a-fA-F:.]+$/.test(first) ? first : null;
}

// Registra os aceites com a sessão do PRÓPRIO aluno (a RLS garante que só vale para ele).
export async function recordConsents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  studentId: string,
  types: ConsentType[],
) {
  const h = await headers();
  const ip = firstIp(h.get("x-forwarded-for"));
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;

  const rows = types.map((type) => ({
    user_id: userId,
    student_id: studentId,
    type,
    version: CONSENT_VERSION,
    ip,
    user_agent: userAgent,
  }));

  const { error } = await supabase.from("consents").insert(rows);
  if (error) console.error("recordConsents:", error.message);
  return { ok: !error };
}
