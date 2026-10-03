"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CONSENT_VERSION } from "@/lib/consents";
import { LEAD_STATUSES, leadSchema, type LeadInput } from "@/lib/leads";
import type { Database } from "@/types/database.types";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

type Result = { ok?: boolean; error?: string; repeated?: boolean };

// Formulário público "Quero me tornar aluno". Sem login: o visitante só tem permissão de INSERIR
// (o banco escolhe o Personal, força status "novo" e barra envios repetidos — ver a migração).
// `website` é um campo escondido na tela: pessoas não veem, robôs costumam preencher.
export async function submitLead(input: LeadInput, website?: string): Promise<Result> {
  if (website) return { ok: true }; // robô: finge que deu certo e não grava

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira as respostas." };
  const l = parsed.data;

  // personal_id NÃO vai daqui, de propósito: o visitante não tem permissão nessa coluna e o
  // trigger leads_before_insert preenche com o Personal do sistema. O tipo gerado pelo Supabase
  // pede o campo (ele é obrigatório na tabela), por isso a conversão de tipo no insert.
  const row = {
    full_name: l.fullName,
    whatsapp: l.whatsapp,
    goal: l.goal,
    experience: l.experience,
    days_per_week: l.daysPerWeek,
    modality: l.modality,
    privacy_version: CONSENT_VERSION,
  } satisfies Omit<LeadInsert, "personal_id">;

  const supabase = await createClient();
  // Sem .select() depois do insert: o visitante não tem permissão de LER a tabela.
  const { error } = await supabase.from("leads").insert(row as LeadInsert);

  if (error) {
    if (error.message.includes("LEAD_REPETIDO")) return { ok: true, repeated: true };
    if (error.message.includes("LEAD_LIMITE")) {
      return { error: "Muitos envios neste momento. Tente de novo em alguns minutos." };
    }
    if (error.message.includes("LEAD_SEM_PERSONAL")) {
      return { error: "O cadastro de interessados ainda não está configurado. Tente mais tarde." };
    }
    console.error("submitLead:", error);
    return { error: "Não foi possível enviar suas respostas: " + error.message };
  }
  return { ok: true };
}

const idSchema = z.uuid();
const statusSchema = z.enum(LEAD_STATUSES.map((s) => s.value) as [string, ...string[]]);

export async function setLeadStatus(id: string, status: string): Promise<Result> {
  await requireRole("personal");
  const pid = idSchema.safeParse(id);
  const ps = statusSchema.safeParse(status);
  if (!pid.success || !ps.success) return { error: "Opção inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").update({ status: ps.data }).eq("id", pid.data).select("id");
  if (error) return { error: "Não foi possível salvar: " + error.message };
  if (!data?.length) return { error: "Interessado não encontrado (talvez já tenha sido excluído)." };
  revalidatePath("/personal/interessados");
  return { ok: true };
}

export async function setLeadNotes(id: string, notes: string): Promise<Result> {
  await requireRole("personal");
  const pid = idSchema.safeParse(id);
  const pn = z.string().trim().max(2000, "Observação muito longa (máximo 2000 caracteres).").safeParse(notes);
  if (!pid.success) return { error: "Interessado inválido." };
  if (!pn.success) return { error: pn.error.issues[0]?.message ?? "Observação inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ notes: pn.data || null })
    .eq("id", pid.data)
    .select("id");
  if (error) return { error: "Não foi possível salvar: " + error.message };
  if (!data?.length) return { error: "Interessado não encontrado (talvez já tenha sido excluído)." };
  revalidatePath("/personal/interessados");
  return { ok: true };
}

export async function deleteLead(id: string): Promise<Result> {
  await requireRole("personal");
  const pid = idSchema.safeParse(id);
  if (!pid.success) return { error: "Interessado inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").delete().eq("id", pid.data).select("id");
  if (error) return { error: "Não foi possível excluir: " + error.message };
  if (!data?.length) return { error: "Interessado não encontrado (talvez já tenha sido excluído)." };
  revalidatePath("/personal/interessados");
  return { ok: true };
}
