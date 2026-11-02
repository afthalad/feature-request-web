import "server-only";
import { FieldValue, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { generateApiKey, hashApiKey, apiKeyDisplayPrefix } from "@/lib/auth/apiKey";
import { forgetApiKey } from "@/lib/auth/verifyApiKey";
import { generateUniqueSlug } from "@/lib/slug";
import { APP_ID_FIELDS } from "@/lib/apps/appIds";
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
    iosBundleId: data.iosBundleId ?? null,
    androidPackageName: data.androidPackageName ?? null,
    webDomain: data.webDomain ?? null,
    slug: data.slug ?? "",
    apiKeyPrefix: data.apiKeyPrefix,
    notificationEmail: data.notificationEmail,
    emailOnNewRequest: data.emailOnNewRequest,
        featureCount: data.featureCount,
    createdAt: data.createdAt.toDate().toISOString(),
    disabled: data.disabled ?? false,
    disabledSlug: data.disabledSlug ?? null,
    deleted: data.deleted === true,
    deletedAt: data.deletedAt ? data.deletedAt.toDate().toISOString() : null,
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
    const snapshots = await Promise.all(
      ["slug", ...APP_ID_FIELDS].map((field) =>
        appsRef.where(field, "==", term).limit(limit).get()
      )
    );
    const seen = new Map<string, QueryDocumentSnapshot>();
    for (const doc of snapshots.flatMap((snapshot) => snapshot.docs)) seen.set(doc.id, doc);
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

interface CreateAppForOwnerParams {
  ownerUid: string;
  name: string;
  iosBundleId?: string | null;
  androidPackageName?: string | null;
  webDomain?: string | null;
  notificationEmail?: string;
}

// Admin-initiated app creation, used e.g. to set up an app on a user's behalf. Bypasses the
// per-plan app-count limit that gates the owner-facing create flow (checkAppLimit) — an admin
// override is expected to always succeed.
export async function createAppForOwner({
  ownerUid,
  name,
  iosBundleId,
  androidPackageName,
  webDomain,
  notificationEmail,
}: CreateAppForOwnerParams): Promise<{ app: App; apiKey: string }> {
  const ownerSnap = await adminDb.collection("users").doc(ownerUid).get();
  if (!ownerSnap.exists) throw new Error("Owner user not found.");

  const apiKey = generateApiKey();
  const appRef = adminDb.collection("apps").doc();
  const apiKeyRef = adminDb.collection("apiKeys").doc(hashApiKey(apiKey));
  const slug = await generateUniqueSlug(name);

  const batch = adminDb.batch();
  batch.set(appRef, {
    ownerUid,
    name,
    iosBundleId: iosBundleId ?? null,
    androidPackageName: androidPackageName ?? null,
    webDomain: webDomain ?? null,
    slug,
    apiKeyPrefix: apiKeyDisplayPrefix(apiKey),
    notificationEmail: notificationEmail ?? ownerSnap.data()?.email ?? "",
    emailOnNewRequest: true,
    featureCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(apiKeyRef, {
    appId: appRef.id,
    ownerUid,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  const appSnap = await appRef.get();
  return { app: mapApp(appSnap as QueryDocumentSnapshot), apiKey };
}

// Permanently removes an app: the app doc plus every features/* subcollection (recursively,
// including votes/followers/comments on each feature), and every apiKeys doc that points at it.
// Irreversible — unlike setAppDisabled, there is no way back. Callers are expected to confirm.
export async function deleteApp(appId: string): Promise<void> {
  const appRef = adminDb.collection("apps").doc(appId);

  const keysSnapshot = await adminDb.collection("apiKeys").where("appId", "==", appId).get();
  if (keysSnapshot.size > 0) {
    const batch = adminDb.batch();
    for (const doc of keysSnapshot.docs) batch.delete(doc.ref);
    await batch.commit();
    for (const doc of keysSnapshot.docs) forgetApiKey(doc.id);
  }

  await adminDb.recursiveDelete(appRef);
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
