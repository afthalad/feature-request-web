import "server-only";
import { adminDb } from "@/lib/firebase/admin";

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
): Promise<{ id: string; name: string; slug: string; hideVoteCounts: boolean } | null> {
  const snapshot = await adminDb.collection("apps").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    hideVoteCounts: data.hideVoteCounts ?? false,
  };
}
