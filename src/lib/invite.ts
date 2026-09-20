import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// O token só existe no link enviado ao aluno. No banco fica apenas o HASH (sha256).
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return randomBytes(32).toString("base64url");
}

export async function getSiteUrl() {
  const fromEnv = process.env.APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// Cria um novo convite (revoga os pendentes anteriores do mesmo aluno).
export async function issueInvite(studentId: string, createdBy: string) {
  const admin = createAdminClient();

  await admin
    .from("student_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .is("accepted_at", null)
    .is("revoked_at", null);

  const token = generateToken();
  const { error } = await admin.from("student_invites").insert({
    student_id: studentId,
    token_hash: hashToken(token),
    created_by: createdBy,
  });

  if (error) {
    console.error("issueInvite:", error.message);
    return { error: "Não foi possível gerar o convite." } as const;
  }

  return { url: `${await getSiteUrl()}/convite/${token}` } as const;
}

// Convite válido = existe, não usado, não revogado, não expirado, e o aluno ainda está "convidado".
export async function getValidInvite(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("student_invites")
    .select("id, student_id")
    .eq("token_hash", hashToken(token))
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!invite) return null;

  const { data: student } = await admin
    .from("students")
    .select("id, full_name, email, birth_date, status, user_id")
    .eq("id", invite.student_id)
    .maybeSingle();

  if (!student || student.user_id || student.status !== "convidado") return null;

  return { inviteId: invite.id, student };
}
