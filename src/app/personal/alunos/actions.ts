"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { issueInvite } from "@/lib/invite";
import { isMinor } from "@/lib/utils";

export type StudentFormState = {
  error?: string;
  inviteUrl?: string;
  studentName?: string;
};

export type InviteState = {
  error?: string;
  inviteUrl?: string;
  studentName?: string;
};

const phone = z
  .string()
  .trim()
  .regex(/^[0-9+() .-]{8,20}$/, "Telefone inválido.")
  .or(z.literal(""));

const schema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome completo.").max(120, "Nome muito longo."),
  email: z.email("Informe um e-mail válido."),
  phone,
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de nascimento."),
  sex: z.enum(["masculino", "feminino", "outro", "nao_informado"]),
  goal: z.string().trim().max(500, "Objetivo muito longo."),
  guardian_name: z.string().trim().max(120),
  guardian_email: z.email("E-mail do responsável inválido.").or(z.literal("")),
  guardian_phone: phone,
  training_days: z
    .array(z.coerce.number().int().min(1, "Dia de treino inválido.").max(7, "Dia de treino inválido."))
    .max(7)
    .refine((d) => new Set(d).size === d.length, "Dia de treino repetido."),
});

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const profile = await requireRole("personal");

  const parsed = schema.safeParse({
    full_name: str(formData, "full_name"),
    email: str(formData, "email").trim().toLowerCase(),
    phone: str(formData, "phone"),
    birth_date: str(formData, "birth_date"),
    sex: str(formData, "sex") || "nao_informado",
    goal: str(formData, "goal"),
    guardian_name: str(formData, "guardian_name"),
    guardian_email: str(formData, "guardian_email").trim().toLowerCase(),
    guardian_phone: str(formData, "guardian_phone"),
    training_days: formData.getAll("training_days").map(String),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const birth = new Date(`${d.birth_date}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > new Date() || birth < new Date("1900-01-01")) {
    return { error: "Data de nascimento inválida." };
  }
  if (isMinor(d.birth_date) && !d.guardian_name) {
    return { error: "Aluno menor de 18 anos: informe o nome do responsável legal." };
  }

  const supabase = await createClient();
  const { data: student, error } = await supabase
    .from("students")
    .insert({
      personal_id: profile.id,
      full_name: d.full_name,
      email: d.email,
      phone: d.phone || null,
      birth_date: d.birth_date,
      sex: d.sex,
      goal: d.goal || null,
      guardian_name: d.guardian_name || null,
      guardian_email: d.guardian_email || null,
      guardian_phone: d.guardian_phone || null,
      training_days: [...d.training_days].sort((a, b) => a - b),
    })
    .select("id, full_name")
    .single();

  if (error || !student) {
    if (error?.code === "23505") {
      return { error: "Já existe um aluno cadastrado com este e-mail." };
    }
    console.error("createStudent:", error?.message);
    return { error: "Não foi possível cadastrar o aluno. Tente novamente." };
  }

  revalidatePath("/personal/alunos");

  const invite = await issueInvite(student.id, profile.id);
  if ("error" in invite) {
    return {
      error:
        "Aluno cadastrado, mas não foi possível gerar o convite. Abra a lista de alunos e clique em “Gerar link de convite”.",
    };
  }

  return { inviteUrl: invite.url, studentName: student.full_name };
}

export async function regenerateInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const profile = await requireRole("personal");

  const studentId = str(formData, "student_id");
  if (!z.uuid().safeParse(studentId).success) return { error: "Aluno inválido." };

  // Consulta com a sessão do Personal: a RLS só devolve alunos DELE.
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, status, user_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return { error: "Aluno não encontrado." };
  if (student.user_id || student.status !== "convidado") {
    return { error: "Este aluno já ativou a conta." };
  }

  const invite = await issueInvite(student.id, profile.id);
  if ("error" in invite) return { error: invite.error };

  return { inviteUrl: invite.url, studentName: student.full_name };
}
