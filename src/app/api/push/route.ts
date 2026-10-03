import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendPushForNotification } from "@/lib/push";

// Chamada SÓ pelo banco (trigger notifications_push, via pg_net) a cada aviso novo.
// Protegida por senha (PUSH_WEBHOOK_SECRET, a mesma guardada no Vault do Supabase).
export const runtime = "nodejs";

const bodySchema = z.object({ notification_id: z.uuid() });

function authorized(request: NextRequest) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "pedido inválido" }, { status: 400 });

  try {
    const result = await sendPushForNotification(parsed.data.notification_id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("/api/push:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
