"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadMetrics } from "@/lib/assessment-data";
import { computeCalculated, formatValue, roundTo, todayIso } from "@/lib/assessment";
import { assessmentSchema, type AssessmentInput } from "./schema";

export type AssessmentFormState = { error?: string };

function parsePayload(formData: FormData) {
  const raw = String(formData.get("payload") ?? "");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Dados do formulário corrompidos. Recarregue a página." } as const;
  }
  const parsed = assessmentSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." } as const;
  }
  if (parsed.data.assessed_at > todayIso()) {
    return { ok: false, error: "A data da avaliação não pode estar no futuro." } as const;
  }
  if (parsed.data.assessed_at < "1990-01-01") {
    return { ok: false, error: "Confira a data da avaliação." } as const;
  }
  return { ok: true, data: parsed.data } as const;
}

// Confere cada valor contra o catálogo (faixa mínima/máxima, tipo) e recalcula no servidor
// as métricas calculadas (IMC etc.) — o valor calculado enviado pelo navegador é ignorado.
async function buildValueRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assessmentId: string,
  values: AssessmentInput["values"],
) {
  const { metrics, error } = await loadMetrics(supabase, { activeOnly: false });
  if (error) return { error: "Não foi possível carregar as métricas: " + error.message } as const;
  const byId = new Map(metrics.map((m) => [m.id, m]));

  const numeric: Record<string, number> = {};
  const texts: Record<string, string> = {};
  for (const v of values) {
    const m = byId.get(v.metric_id);
    if (!m) return { error: "Uma das medidas não existe mais. Recarregue a página." } as const;
    if (m.is_calculated) continue;

    if (m.value_type === "text") {
      if (v.value_text) texts[m.id] = v.value_text;
      continue;
    }
    if (v.value_numeric === null) continue;
    const value = roundTo(v.value_numeric, m.decimals);
    if (
      (m.min_value !== null && value < m.min_value) ||
      (m.max_value !== null && value > m.max_value)
    ) {
      const range =
        m.min_value !== null && m.max_value !== null
          ? `entre ${formatValue(m.min_value, m)} e ${formatValue(m.max_value, m)}`
          : m.min_value !== null
            ? `a partir de ${formatValue(m.min_value, m)}`
            : `até ${formatValue(m.max_value!, m)}`;
      return {
        error: `${m.label}: ${formatValue(value, m)} parece fora do normal. O valor precisa estar ${range}.`,
      } as const;
    }
    numeric[m.id] = value;
  }

  const calculated = computeCalculated(metrics, numeric);
  // Uma métrica calculada também tem faixa; se o resultado sair dela, algum dado digitado está errado.
  for (const [id, value] of Object.entries(calculated)) {
    const m = byId.get(id)!;
    if ((m.min_value !== null && value < m.min_value) || (m.max_value !== null && value > m.max_value)) {
      return {
        error: `${m.label} calculado deu ${formatValue(value, m)}, o que não parece possível. Confira os valores usados no cálculo.`,
      } as const;
    }
  }

  const rows = [
    ...Object.entries({ ...numeric, ...calculated }).map(([metric_id, value_numeric]) => ({
      assessment_id: assessmentId,
      metric_id,
      value_numeric,
      value_text: null,
    })),
    ...Object.entries(texts).map(([metric_id, value_text]) => ({
      assessment_id: assessmentId,
      metric_id,
      value_numeric: null,
      value_text,
    })),
  ];
  if (rows.length === 0) return { error: "Preencha ao menos uma medida." } as const;
  return { rows } as const;
}

export async function createAssessment(
  studentId: string,
  _prev: AssessmentFormState,
  formData: FormData,
): Promise<AssessmentFormState> {
  const profile = await requireRole("personal");
  if (!z.uuid().safeParse(studentId).success) return { error: "Aluno inválido." };

  const parsed = parsePayload(formData);
  if (!parsed.ok) return { error: parsed.error };
  const data = parsed.data;

  const supabase = await createClient();
  const { data: assessment, error } = await supabase
    .from("assessments")
    .insert({
      student_id: studentId,
      personal_id: profile.id,
      protocol_id: data.protocol_id,
      assessed_at: data.assessed_at,
      method: data.method,
      device: data.device,
      notes: data.notes,
    })
    .select("id")
    .single();
  if (error || !assessment) return { error: "Não foi possível criar a avaliação: " + error?.message };

  const built = await buildValueRows(supabase, assessment.id, data.values);
  const valuesError =
    "error" in built
      ? built.error
      : (await supabase.from("assessment_values").insert(built.rows)).error?.message;

  if (valuesError) {
    // Não deixa uma avaliação vazia para trás se as medidas não foram gravadas.
    await supabase.from("assessments").delete().eq("id", assessment.id);
    return { error: "Não foi possível salvar as medidas: " + valuesError };
  }

  revalidatePath(`/personal/alunos/${studentId}`);
  revalidatePath(`/personal/alunos/${studentId}/avaliacoes`);
  redirect(`/personal/alunos/${studentId}/avaliacoes/${assessment.id}?salvo=1`);
}

export async function updateAssessment(
  studentId: string,
  assessmentId: string,
  _prev: AssessmentFormState,
  formData: FormData,
): Promise<AssessmentFormState> {
  await requireRole("personal");
  if (!z.uuid().safeParse(studentId).success || !z.uuid().safeParse(assessmentId).success) {
    return { error: "Dados inválidos." };
  }

  const parsed = parsePayload(formData);
  if (!parsed.ok) return { error: parsed.error };
  const data = parsed.data;

  const supabase = await createClient();

  // Valida tudo ANTES de apagar os valores antigos, para não perder dados por um erro de digitação.
  const built = await buildValueRows(supabase, assessmentId, data.values);
  if ("error" in built) return { error: built.error };

  const { data: updated, error } = await supabase
    .from("assessments")
    .update({
      protocol_id: data.protocol_id,
      assessed_at: data.assessed_at,
      method: data.method,
      device: data.device,
      notes: data.notes,
    })
    .eq("id", assessmentId)
    .eq("student_id", studentId)
    .select("id");
  if (error) return { error: "Não foi possível salvar a avaliação: " + error.message };
  if (!updated?.length) return { error: "Avaliação não encontrada." };

  const { error: delErr } = await supabase
    .from("assessment_values")
    .delete()
    .eq("assessment_id", assessmentId);
  if (delErr) return { error: "Não foi possível atualizar as medidas: " + delErr.message };

  const { error: insErr } = await supabase.from("assessment_values").insert(built.rows);
  if (insErr) {
    return {
      error:
        "As medidas antigas foram removidas, mas as novas não foram salvas: " +
        insErr.message +
        ". Tente salvar de novo antes de sair desta tela.",
    };
  }

  revalidatePath(`/personal/alunos/${studentId}`);
  revalidatePath(`/personal/alunos/${studentId}/avaliacoes`);
  revalidatePath(`/personal/alunos/${studentId}/avaliacoes/${assessmentId}`);
  redirect(`/personal/alunos/${studentId}/avaliacoes/${assessmentId}?salvo=1`);
}

export async function deleteAssessment(
  studentId: string,
  assessmentId: string,
  _prev: AssessmentFormState,
  _formData: FormData,
): Promise<AssessmentFormState> {
  await requireRole("personal");
  if (!z.uuid().safeParse(studentId).success || !z.uuid().safeParse(assessmentId).success) {
    return { error: "Dados inválidos." };
  }

  const supabase = await createClient();
  // Os valores (assessment_values) somem junto, em cascata.
  const { data: deleted, error } = await supabase
    .from("assessments")
    .delete()
    .eq("id", assessmentId)
    .eq("student_id", studentId)
    .select("id");
  if (error) return { error: "Não foi possível excluir a avaliação: " + error.message };
  if (!deleted?.length) return { error: "Avaliação não encontrada (talvez já tenha sido excluída)." };

  revalidatePath(`/personal/alunos/${studentId}`);
  revalidatePath(`/personal/alunos/${studentId}/avaliacoes`);
  redirect(`/personal/alunos/${studentId}/avaliacoes`);
}
