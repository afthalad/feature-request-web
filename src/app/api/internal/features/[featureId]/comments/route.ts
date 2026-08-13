import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { createCommentSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import {
  listCommentsForFeature,
  createComment,
  NotFoundError,
} from "@/lib/comments/service";

async function verifyOwnership(appId: string, uid: string) {
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists) return false;
  return appSnap.data()!.ownerUid === uid;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { featureId } = await params;
  const appId = new URL(req.url).searchParams.get("appId");
  if (!appId) return errorResponse("validation_failed", "appId is required.");

  if (!(await verifyOwnership(appId, user.uid))) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const comments = await listCommentsForFeature(appId, featureId);
  return ok({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { featureId } = await params;
  const body = await req.json().catch(() => null);
  const appId = body?.appId;
  if (!appId) return errorResponse("validation_failed", "appId is required.");

  if (!(await verifyOwnership(appId, user.uid))) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const parsed = createCommentSchema.pick({ text: true }).safeParse(body);
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    const comment = await createComment({
      appId,
      featureId,
      deviceId: `dev:${user.uid}`,
      text: parsed.data.text,
      authorName: user.name ?? "Developer",
      isDeveloper: true,
    });
    return ok(comment, 201);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse("not_found", "Feature not found.");
    }
    console.error("Failed to create comment", error);
    return errorResponse("internal", "Failed to create comment.");
  }
}
