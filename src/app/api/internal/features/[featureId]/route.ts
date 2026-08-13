import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { updateFeatureStatusSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import { sendStatusChangeEmails } from "@/lib/email/send";
import { NOTIFIABLE_STATUSES } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { featureId } = await params;
  const parsed = updateFeatureStatusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const { appId, status, notify } = parsed.data;

  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists) return errorResponse("not_found", "App not found.");
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const featureRef = appSnap.ref.collection("features").doc(featureId);
  const featureSnap = await featureRef.get();
  if (!featureSnap.exists) return errorResponse("not_found", "Feature not found.");

  await featureRef.update({ status, updatedAt: FieldValue.serverTimestamp() });

  if (notify && NOTIFIABLE_STATUSES.includes(status)) {
    void sendStatusChangeEmails({
      appId,
      featureId,
      featureTitle: featureSnap.data()!.title,
      status,
    }).catch(console.error);
  }

  return ok({ id: featureId, status });
}
