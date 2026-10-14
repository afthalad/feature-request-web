import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyApiKey } from "@/lib/auth/verifyApiKey";
import { ok, errorResponse } from "@/lib/api/response";
import { PLAN_LIMITS, type Plan } from "@/lib/plans/limits";

export async function GET(req: NextRequest) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const [userSnap, appSnap] = await Promise.all([
    adminDb.collection("users").doc(keyInfo.ownerUid).get(),
    adminDb.collection("apps").doc(keyInfo.appId).get(),
  ]);

  const userPlan = userSnap.data()?.plan;
  const plan: Plan = userPlan === "pro" || userPlan === "starter" ? userPlan : "free";
  const app = appSnap.data();

  // hideVoteCounts travels with the config so every SDK board hides counts the same way the
  // public web board does, instead of each one having to ask for app settings separately.
  return ok({
    showBranding: PLAN_LIMITS[plan].showBranding,
    hideVoteCounts: app?.hideVoteCounts === true,
    appName: (app?.name as string | undefined) ?? null,
  });
}
