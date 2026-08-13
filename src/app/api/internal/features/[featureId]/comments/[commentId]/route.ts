import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { ok, errorResponse } from "@/lib/api/response";
import { deleteComment, NotFoundError } from "@/lib/comments/service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string; commentId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { featureId, commentId } = await params;
  const body = await req.json().catch(() => null);
  const appId = body?.appId;
  if (!appId) return errorResponse("validation_failed", "appId is required.");

  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists) return errorResponse("not_found", "App not found.");
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  try {
    await deleteComment(appId, featureId, commentId);
    return ok({ id: commentId });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse("not_found", "Comment not found.");
    }
    console.error("Failed to delete comment", error);
    return errorResponse("internal", "Failed to delete comment.");
  }
}
