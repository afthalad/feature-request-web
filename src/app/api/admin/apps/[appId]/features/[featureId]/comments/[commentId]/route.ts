import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { hardDeleteComment, updateComment } from "@/lib/admin/features";
import { logAdminAction } from "@/lib/admin/audit";
import { adminUpdateCommentSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string; commentId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId, commentId } = await params;
  const parsed = adminUpdateCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    await updateComment(appId, featureId, commentId, parsed.data.text);
  } catch {
    return errorResponse("not_found", "Comment not found.");
  }

  await logAdminAction({
    adminUid: admin.uid,
    action: "comment.update",
    targetType: "comment",
    targetId: `${appId}/${featureId}/${commentId}`,
    after: parsed.data,
  });

  return ok({ id: commentId, text: parsed.data.text });
}

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
