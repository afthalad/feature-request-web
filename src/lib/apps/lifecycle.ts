import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { forgetApiKey } from "@/lib/auth/verifyApiKey";
import { generateUniqueSlug, slugExists } from "@/lib/slug";

// An owner deleting an app is a soft delete: the app leaves their dashboard and stops working
// everywhere at once (API keys off, public board gone, no emails), but its data is kept until an
// admin either restores it or deletes it permanently (deleteApp in src/lib/admin/apps.ts).
//
// `deleted` is the flag every check reads; `deletedAt` is for display. Only keys that were
// active at deletion are marked `deactivatedByDelete`, so a restore can't revive a key the owner
// had already regenerated away.

export async function softDeleteApp(appId: string): Promise<void> {
  const appRef = adminDb.collection("apps").doc(appId);
  const activeKeys = await adminDb
    .collection("apiKeys")
    .where("appId", "==", appId)
    .where("active", "==", true)
    .get();

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(appRef);
    if (!snap.exists || snap.get("deleted") === true) return;
    tx.update(appRef, {
      deleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      deletedSlug: snap.get("slug") ?? null,
      slug: FieldValue.delete(),
    });
    for (const key of activeKeys.docs) {
      tx.update(key.ref, { active: false, deactivatedByDelete: true });
    }
  });
  for (const key of activeKeys.docs) forgetApiKey(key.id);
}

/** Undoes softDeleteApp. The board gets its old link back, or a fresh one if it was taken since. */
export async function restoreApp(appId: string): Promise<void> {
  const appRef = adminDb.collection("apps").doc(appId);
  const [snap, keys] = await Promise.all([
    appRef.get(),
    adminDb
      .collection("apiKeys")
      .where("appId", "==", appId)
      .where("deactivatedByDelete", "==", true)
      .get(),
  ]);
  if (!snap.exists || snap.get("deleted") !== true) return;

  let slug: string | null = snap.get("deletedSlug") ?? null;
  if (slug && (await slugExists(slug, appId))) {
    slug = await generateUniqueSlug(snap.get("name"), appId);
  }

  const batch = adminDb.batch();
  batch.update(appRef, {
    deleted: FieldValue.delete(),
    deletedAt: FieldValue.delete(),
    deletedSlug: FieldValue.delete(),
    ...(slug ? { slug } : {}),
  });
  for (const key of keys.docs) {
    batch.update(key.ref, { active: true, deactivatedByDelete: FieldValue.delete() });
  }
  await batch.commit();
  // Drop the cached "invalid key" answers so the SDKs recover straight away on this instance.
  for (const key of keys.docs) forgetApiKey(key.id);
}
