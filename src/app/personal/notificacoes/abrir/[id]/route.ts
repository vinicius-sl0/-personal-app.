import type { NextRequest } from "next/server";
import { openNotification } from "@/lib/notification-open";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return openNotification(request, id, "personal");
}
