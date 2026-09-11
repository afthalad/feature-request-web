import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { hardDeleteComment } from "@/lib/admin/features";
import { logAdminAction } from "@/lib/admin/audit";
import { ok, errorResponse } from "@/lib/api/response";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string; commentId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId, commentId } = await params;
  await hardDeleteComment(appId, featureId, commentId);

  await logAdminAction({
    adminUid: admin.uid,
    action: "comment.hard_delete",
    targetType: "comment",
    targetId: `${appId}/${featureId}/${commentId}`,
  });

  return ok({ id: commentId });
}
