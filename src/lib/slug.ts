import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { getOwnerPlan, PLAN_LIMITS } from "@/lib/plans/limits";

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "app";
}

export async function generateUniqueSlug(name: string, excludeAppId?: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  while (await slugExists(candidate, excludeAppId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function slugExists(slug: string, excludeAppId?: string): Promise<boolean> {
  const snapshot = await adminDb.collection("apps").where("slug", "==", slug).limit(2).get();
  return snapshot.docs.some((doc) => doc.id !== excludeAppId);
}

export async function resolveAppBySlug(
  slug: string
): Promise<{
  id: string;
  name: string;
  slug: string;
  hideVoteCounts: boolean;
  ownerUid: string;
} | null> {
  const snapshot = await adminDb.collection("apps").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  if (data.deleted === true) return null;
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    hideVoteCounts: data.hideVoteCounts ?? false,
    ownerUid: data.ownerUid,
  };
}

/**
 * The app behind a public web board, or null when there is none to show: unknown slug, or the
 * owner's plan doesn't include public boards (PLAN_LIMITS.publicBoard, Pro only).
 */
export async function resolvePublicBoard(slug: string) {
  const app = await resolveAppBySlug(slug);
  if (!app) return null;
  const plan = await getOwnerPlan(app.ownerUid);
  return PLAN_LIMITS[plan].publicBoard ? app : null;
}
