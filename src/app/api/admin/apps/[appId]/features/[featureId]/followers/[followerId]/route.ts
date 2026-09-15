import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { removeFollowerAdmin } from "@/lib/admin/followers";
import { logAdminAction } from "@/lib/admin/audit";
import { ok, errorResponse } from "@/lib/api/response";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string; followerId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId, followerId } = await params;
  try {
    await removeFollowerAdmin(appId, featureId, followerId);
  } catch {
    return errorResponse("not_found", "Follower not found.");
  }

  await logAdminAction({
    adminUid: admin.uid,
    action: "follower.delete",
    targetType: "follower",
    targetId: `${appId}/${featureId}/${followerId}`,
  });

  return ok({ id: followerId });
}
