import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// Cliente para componentes do navegador ("use client").
// Usa somente a chave PUBLISHABLE; quem protege os dados é a RLS do banco.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
