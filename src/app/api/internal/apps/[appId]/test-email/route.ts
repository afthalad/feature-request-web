import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { sendTestEmail } from "@/lib/email/send";
import { ok, errorResponse } from "@/lib/api/response";

export async function POST(
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

  const result = await sendTestEmail(appId);
  if (!result.ok) {
    return errorResponse("internal", result.message);
  }

  return ok({ sent: true });
}
