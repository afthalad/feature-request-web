import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { hashApiKey } from "@/lib/auth/apiKey";
import { errorResponse } from "@/lib/api/response";
import { getCallerId, isCallerAllowed, readAppIds, type AppIds } from "@/lib/apps/appIds";

interface VerifiedApiKey {
  appId: string;
  ownerUid: string;
  appIds: AppIds;
}

// Every SDK request starts with this lookup, so without a cache each one paid a Firestore read
// and a full database round trip before doing any real work. Warm serverless instances keep
// this map between requests. Keyed by hash, so raw keys are never held in memory.
//
// Trade-off: a key revoked, regenerated or deleted elsewhere keeps working for up to
// VALID_TTL_MS on instances that already cached it. The instance doing the revoking forgets it
// at once via forgetApiKey. Publishable keys only allow board actions, so a minute is acceptable.
const VALID_TTL_MS = 60_000;
// Unknown or inactive keys are remembered briefly too, so a flood of bad keys costs no reads.
const INVALID_TTL_MS = 30_000;
const MAX_ENTRIES = 500;

const cache = new Map<string, { value: VerifiedApiKey | null; expiresAt: number }>();

export async function requireApiKey(req: Request): Promise<VerifiedApiKey | Response> {
  const apiKey = await verifyApiKey(req);
  if (!apiKey) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const callerId = getCallerId(req);
  if (!isCallerAllowed(callerId, apiKey.appIds)) {
    return errorResponse(
      "wrong_app",
      `This API key is not set up for ${callerId}. Add it to your app in the Fewchurs dashboard.`
    );
  }

  return apiKey;
}

async function verifyApiKey(req: Request): Promise<VerifiedApiKey | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const key = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!key) return null;

  const hash = hashApiKey(key);
  const cached = cache.get(hash);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const keyDoc = await adminDb.collection("apiKeys").doc(hash).get();
  const data = keyDoc.exists ? keyDoc.data() : undefined;
  const value: VerifiedApiKey | null = data?.active
    ? { appId: data.appId, ownerUid: data.ownerUid, appIds: await getAppIds(data.appId) }
    : null;

  remember(hash, value);
  return value;
}

async function getAppIds(appId: string): Promise<AppIds> {
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  return readAppIds(appSnap.data());
}

/** Drops a key from this instance's cache, for code that revokes, replaces or deletes keys. */
export function forgetApiKey(hash: string): void {
  cache.delete(hash);
}

function remember(hash: string, value: VerifiedApiKey | null): void {
  // Re-inserting moves the entry to the end, so the oldest entry is always first in line.
  cache.delete(hash);
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(hash, {
    value,
    expiresAt: Date.now() + (value ? VALID_TTL_MS : INVALID_TTL_MS),
  });
}

export function getDeviceId(req: Request): string | null {
  return req.headers.get("x-device-id");
}
