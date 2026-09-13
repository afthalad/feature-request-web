import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { ok, errorResponse } from "@/lib/api/response";
import { listFollowersForFeature } from "@/lib/followers/service";
import { maskEmail } from "@/lib/email/mask";

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
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("appId");
  if (!appId) return errorResponse("validation_failed", "appId is required.");

  if (!(await verifyOwnership(appId, user.uid))) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");

  const result = await listFollowersForFeature({ appId, featureId, limit, cursor });
  return ok({
    ...result,
    followers: result.followers.map((follower) => ({
      ...follower,
      email: maskEmail(follower.email),
    })),
  });
}
