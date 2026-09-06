import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyApiKey } from "@/lib/auth/verifyApiKey";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const userSnap = await adminDb.collection("users").doc(keyInfo.ownerUid).get();
  const plan = userSnap.data()?.plan;

  return ok({ showBranding: plan !== "pro" });
}
