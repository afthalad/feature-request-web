import { NextRequest, after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireApiKey } from "@/lib/auth/verifyApiKey";
import { ok } from "@/lib/api/response";
import { PLAN_LIMITS, type Plan } from "@/lib/plans/limits";
import { sendServerEvent } from "@/lib/analytics/server";

export async function GET(req: NextRequest) {
  const keyInfo = await requireApiKey(req);
  if (keyInfo instanceof Response) return keyInfo;

  const [userSnap, appSnap] = await Promise.all([
    adminDb.collection("users").doc(keyInfo.ownerUid).get(),
    adminDb.collection("apps").doc(keyInfo.appId).get(),
  ]);

  const userPlan = userSnap.data()?.plan;
  const plan: Plan = userPlan === "pro" || userPlan === "starter" ? userPlan : "free";
  const app = appSnap.data();

  // The first time an app's SDK checks in, record it once: the step between "created an app"
  // and "got feedback" in the activation funnel. The precondition means two first requests
  // racing each other only record it once.
  if (app && !app.sdkConnectedAt) {
    const sdk = req.headers.get("x-fewchurs-sdk") ?? null;
    after(() =>
      appSnap.ref
        .update({ sdkConnectedAt: FieldValue.serverTimestamp() }, { lastUpdateTime: appSnap.updateTime! })
        .then(() =>
          sendServerEvent(keyInfo.ownerUid, "sdk_connected", {
            app_id: keyInfo.appId,
            sdk,
            plan,
            $set_once: { first_sdk_connected_at: new Date().toISOString() },
          })
        )
        .catch(() => {
          // Someone else got there first, or the write failed: try again on a later request.
        })
    );
  }

  // hideVoteCounts travels with the config so every SDK board hides counts the same way the
  // public web board does, instead of each one having to ask for app settings separately.
  return ok({
    showBranding: PLAN_LIMITS[plan].showBranding,
    hideVoteCounts: app?.hideVoteCounts === true,
    appName: (app?.name as string | undefined) ?? null,
  });
}
