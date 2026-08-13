import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { hashApiKey } from "@/lib/auth/apiKey";

interface VerifiedApiKey {
  appId: string;
  ownerUid: string;
}

export async function verifyApiKey(req: Request): Promise<VerifiedApiKey | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const key = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!key) return null;

  const keyDoc = await adminDb.collection("apiKeys").doc(hashApiKey(key)).get();
  if (!keyDoc.exists) return null;

  const data = keyDoc.data();
  if (!data?.active) return null;

  return { appId: data.appId, ownerUid: data.ownerUid };
}

export function getDeviceId(req: Request): string | null {
  return req.headers.get("x-device-id");
}
