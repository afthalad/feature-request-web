import "server-only";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getUserPlan, PLAN_LIMITS, type Plan } from "@/lib/plans/limits";

// Free and Starter apps show their first N requests (oldest first; ties broken by id, Firestore's
// own order) everywhere: in-app boards, the dashboard and full notification emails. Later requests
// are still collected — submissions are never blocked — but stay locked until the owner upgrades.

/** How many requests the plan shows per app; Infinity when it shows all of them. */
export function visibleLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].maxFeaturesPerApp;
}

/**
 * The app's visible requests as full documents, oldest first: the whole window a capped board
 * may show. Read fresh (vote counts change), at most the plan's limit.
 */
export async function getVisibleWindow(
  appId: string,
  plan: Plan,
): Promise<QueryDocumentSnapshot[] | null> {
  const limit = visibleLimit(plan);
  if (!Number.isFinite(limit)) return null;
  const snap = await adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();
  return snap.docs;
}

// The dashboard and single-request reads only need to know which ids are visible, so warm
// instances keep that set briefly. Once an app is full, new submissions never change it (they
// are newer); only deletes do, and those call forgetVisibleIds. Other instances catch up within
// IDS_TTL_MS.
const IDS_TTL_MS = 60_000;
const MAX_CACHED_APPS = 500;
const idsCache = new Map<string, { ids: Set<string>; expiresAt: number }>();

/** Ids of the app's visible requests, or null when the plan shows every request it has. */
export async function getVisibleIds(appId: string, plan: Plan): Promise<Set<string> | null> {
  const limit = visibleLimit(plan);
  if (!Number.isFinite(limit)) return null;

  const key = `${appId}:${limit}`;
  const cached = idsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.ids;

  const snap = await adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .select()
    .get();
  // Fewer requests than the plan shows: nothing is locked. Not cached, since the next
  // submission is visible too.
  if (snap.size < limit) return null;

  const ids = new Set(snap.docs.map((doc) => doc.id));
  idsCache.delete(key);
  if (idsCache.size >= MAX_CACHED_APPS) {
    const oldest = idsCache.keys().next().value;
    if (oldest !== undefined) idsCache.delete(oldest);
  }
  idsCache.set(key, { ids, expiresAt: Date.now() + IDS_TTL_MS });
  return ids;
}

/** Drops an app's cached visible ids, for code that deletes requests. */
export function forgetVisibleIds(appId: string): void {
  for (const key of idsCache.keys()) {
    if (key.startsWith(`${appId}:`)) idsCache.delete(key);
  }
}

export function isLocked(featureId: string, visibleIds: Set<string> | null): boolean {
  return visibleIds !== null && !visibleIds.has(featureId);
}

/**
 * Whether the owner's plan locks this request, for dashboard actions that would reveal it
 * (reading comments, translating, changing status). Reads the plan fresh so an upgrade
 * unlocks at once.
 */
export async function isFeatureLockedForOwner(
  appId: string,
  featureId: string,
  ownerUid: string,
): Promise<boolean> {
  const plan = await getUserPlan(ownerUid);
  return isLocked(featureId, await getVisibleIds(appId, plan));
}
