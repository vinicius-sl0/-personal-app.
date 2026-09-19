import { createBrowserClient } from "@supabase/ssr";

// Cliente para componentes do navegador ("use client").
// Usa somente a chave PUBLISHABLE; quem protege os dados é a RLS do banco.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
