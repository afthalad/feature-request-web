import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { generateApiKey, hashApiKey, apiKeyDisplayPrefix } from "@/lib/auth/apiKey";
import { ok, errorResponse } from "@/lib/api/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { appId } = await params;
  const appRef = adminDb.collection("apps").doc(appId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) return errorResponse("not_found", "App not found.");
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const oldKeysSnapshot = await adminDb
    .collection("apiKeys")
    .where("appId", "==", appId)
    .where("active", "==", true)
    .get();

  const newApiKey = generateApiKey();
  const newKeyRef = adminDb.collection("apiKeys").doc(hashApiKey(newApiKey));

  try {
    const batch = adminDb.batch();
    for (const doc of oldKeysSnapshot.docs) {
      batch.update(doc.ref, { active: false });
    }
    batch.set(newKeyRef, {
      appId,
      ownerUid: user.uid,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    batch.update(appRef, { apiKeyPrefix: apiKeyDisplayPrefix(newApiKey) });
    await batch.commit();

    return ok({ apiKey: newApiKey });
  } catch (error) {
    console.error("Failed to regenerate API key", error);
    return errorResponse("internal", "Failed to regenerate API key.");
  }
}
