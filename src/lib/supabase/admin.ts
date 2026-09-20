import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// ATENÇÃO: este cliente IGNORA a RLS (chave service_role/secret).
// Só pode ser usado em código de servidor, para tarefas estreitas:
// criar convites e criar a conta do aluno. NUNCA importe em componentes "use client".
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local (reinicie o servidor após editar).",
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
