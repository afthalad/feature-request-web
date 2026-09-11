import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { lookupUnsubscribe, removeUnsubscribe } from "@/lib/email/unsubscribe";
import { logAdminAction } from "@/lib/admin/audit";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim();
  if (!email) return errorResponse("validation_failed", "email is required.");

  const result = await lookupUnsubscribe(email);
  return ok({ email, unsubscribed: result !== null, createdAt: result?.createdAt ?? null });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim();
  if (!email) return errorResponse("validation_failed", "email is required.");

  const removed = await removeUnsubscribe(email);
  if (!removed) return errorResponse("not_found", "That email is not unsubscribed.");

  await logAdminAction({
    adminUid: admin.uid,
    action: "unsubscribe.remove",
    targetType: "unsubscribe",
    targetId: email,
  });

  return ok({ email, unsubscribed: false });
}
