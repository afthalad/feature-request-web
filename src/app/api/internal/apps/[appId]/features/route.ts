import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { listFeaturesForOwner } from "@/lib/features/service";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { appId } = await params;
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists) return errorResponse("not_found", "App not found.");
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const { searchParams } = new URL(req.url);
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "top" || tabParam === "approved" ? tabParam : "pending";
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");
  const served = Math.max(Number(searchParams.get("served")) || 0, 0);

  const userSnap = await adminDb.collection("users").doc(user.uid).get();
  const userPlan = userSnap.data()?.plan;
  const plan = userPlan === "pro" || userPlan === "starter" ? userPlan : "free";

  const result = await listFeaturesForOwner({ appId, tab, limit, cursor, plan, served });
  return ok(result);
}
