import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import {
  createFeatureForApp,
  listFeaturesForOwner,
  LimitExceededError,
  RateLimitError,
} from "@/lib/features/service";
import { createFeatureSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import { isAppPlatformId } from "@/lib/apps/appIds";

/**
 * The owner posts a request to their own board, e.g. the first idea from the dashboard's setup
 * card. It goes through the same path as one from the SDK (daily quota, owner email), and counts
 * as an ordinary request.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { appId } = await params;
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists || appSnap.get("deleted") === true) {
    return errorResponse("not_found", "App not found.");
  }
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const parsed = createFeatureSchema
    .pick({ title: true, description: true })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", "Write at least 3 characters.");
  }

  try {
    const feature = await createFeatureForApp({
      appId,
      // Stable per owner, so their own votes and quota stay theirs.
      deviceId: createHash("sha256").update(`owner:${user.uid}`).digest("hex"),
      title: parsed.data.title,
      description: parsed.data.description,
      platform: null,
    });
    return ok(feature, 201);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return errorResponse("rate_limited", "You've added a lot of ideas today. Try again tomorrow.");
    }
    if (error instanceof LimitExceededError) {
      return errorResponse("limit_reached", error.message);
    }
    console.error("Failed to create feature from dashboard", error);
    return errorResponse("internal", "We couldn't add that idea. Please try again.");
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { appId } = await params;
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  // A deleted app is gone for its owner (see src/lib/apps/lifecycle.ts).
  if (!appSnap.exists || appSnap.get("deleted") === true) {
    return errorResponse("not_found", "App not found.");
  }
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status = statusParam === "pending" || statusParam === "approved" ? statusParam : "all";
  const sortParam = searchParams.get("sort");
  const sort = sortParam === "oldest" || sortParam === "top" ? sortParam : "newest";
  const paidOnly = searchParams.get("paid") === "true";
  const platformParam = searchParams.get("platform");
  const platform = isAppPlatformId(platformParam) ? platformParam : null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");

  const userSnap = await adminDb.collection("users").doc(user.uid).get();
  const userPlan = userSnap.data()?.plan;
  const plan = userPlan === "pro" || userPlan === "starter" ? userPlan : "free";

  const result = await listFeaturesForOwner({
    appId,
    status,
    sort,
    paidOnly,
    platform,
    limit,
    cursor,
    plan,
  });
  return ok(result);
}
