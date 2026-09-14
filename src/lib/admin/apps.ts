import "server-only";
import { FieldValue, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { App } from "@/types";

interface ListAppsParams {
  limit: number;
  cursor: string | null;
  search?: string;
}

function mapApp(doc: QueryDocumentSnapshot): App {
  const data = doc.data();
  return {
    id: doc.id,
    ownerUid: data.ownerUid,
    name: data.name,
    bundleId: data.bundleId,
    slug: data.slug ?? "",
    apiKeyPrefix: data.apiKeyPrefix,
    notificationEmail: data.notificationEmail,
    emailOnNewRequest: data.emailOnNewRequest,
    platforms: data.platforms ?? [],
    featureCount: data.featureCount,
    createdAt: data.createdAt.toDate().toISOString(),
    disabled: data.disabled ?? false,
    disabledSlug: data.disabledSlug ?? null,
  };
}

export async function listApps({
  limit,
  cursor,
  search,
}: ListAppsParams): Promise<{ apps: App[]; nextCursor: string | null }> {
  const appsRef = adminDb.collection("apps");

  if (search) {
    const term = search.trim();
    const [bySlug, byBundleId] = await Promise.all([
      appsRef.where("slug", "==", term).limit(limit).get(),
      appsRef.where("bundleId", "==", term).limit(limit).get(),
    ]);
    const seen = new Map<string, QueryDocumentSnapshot>();
    for (const doc of [...bySlug.docs, ...byBundleId.docs]) seen.set(doc.id, doc);
    return { apps: [...seen.values()].map(mapApp), nextCursor: null };
  }

  let query = appsRef.orderBy("createdAt", "desc").limit(limit + 1);
  if (cursor) {
    const cursorSnap = await appsRef.doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;
  const nextCursor = hasMore ? docs[docs.length - 1].id : null;

  return { apps: docs.map(mapApp), nextCursor };
}

export async function getApp(appId: string): Promise<App | null> {
  const snap = await adminDb.collection("apps").doc(appId).get();
  if (!snap.exists) return null;
  return mapApp(snap as QueryDocumentSnapshot);
}

export async function updateApp(
  appId: string,
  patch: Partial<Pick<App, "name" | "notificationEmail" | "emailOnNewRequest">>
): Promise<void> {
  await adminDb.collection("apps").doc(appId).update(patch);
}

export async function setAppDisabled(appId: string, disabled: boolean): Promise<void> {
  const appRef = adminDb.collection("apps").doc(appId);

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(appRef);
    if (!snap.exists) return;
    const data = snap.data()!;

    if (disabled) {
      tx.update(appRef, {
        disabled: true,
        disabledSlug: data.slug ?? null,
        slug: FieldValue.delete(),
      });
    } else {
      tx.update(appRef, {
        disabled: false,
        slug: data.disabledSlug ?? data.slug ?? null,
        disabledSlug: FieldValue.delete(),
      });
    }
  });
}
