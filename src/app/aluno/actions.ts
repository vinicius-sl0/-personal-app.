"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseConsents, recordConsents } from "@/lib/consents";
import { isMinor } from "@/lib/utils";

export type TermsState = { error?: string };

// Conclui o aceite quando o aluno já tem conta mas ainda está "convidado".
export async function acceptTerms(
  _prev: TermsState,
  formData: FormData,
): Promise<TermsState> {
  const profile = await requireRole("aluno");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, birth_date")
    .maybeSingle();
  if (!student) return { error: "Cadastro do aluno não encontrado." };

  const parsed = parseConsents(formData, isMinor(student.birth_date));
  if (!parsed.ok) return { error: parsed.error };

  const { data: existing } = await supabase
    .from("consents")
    .select("type")
    .eq("student_id", student.id)
    .is("revoked_at", null);

  const have = new Set((existing ?? []).map((c) => c.type));
  const toInsert = parsed.types.filter((t) => !have.has(t));

  if (toInsert.length > 0) {
    const result = await recordConsents(supabase, profile.id, student.id, toInsert);
    if (!result.ok) return { error: "Não foi possível registrar o aceite. Tente novamente." };
  }

  redirect("/aluno");
}
