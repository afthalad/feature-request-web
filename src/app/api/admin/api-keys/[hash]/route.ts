import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { revokeApiKey } from "@/lib/admin/apiKeys";
import { logAdminAction } from "@/lib/admin/audit";
import { ok, errorResponse } from "@/lib/api/response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { hash } = await params;
  await revokeApiKey(hash);

  await logAdminAction({
    adminUid: admin.uid,
    action: "apiKey.revoke",
    targetType: "apiKey",
    targetId: hash,
  });

  return ok({ hash, active: false });
}
