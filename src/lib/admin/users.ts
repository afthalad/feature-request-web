import "server-only";
import { FieldValue, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AdminUser, AdminWebhookEvent, App, Plan } from "@/types";

interface ListUsersParams {
  limit: number;
  cursor: string | null;
  email?: string;
}

function mapUser(doc: QueryDocumentSnapshot): AdminUser {
  const data = doc.data();
  return {
    uid: doc.id,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    photoURL: data.photoURL ?? "",
    plan: data.plan === "pro" || data.plan === "starter" ? data.plan : "free",
    createdAt: data.createdAt?.toDate().toISOString() ?? new Date(0).toISOString(),
    dodoCustomerId: data.dodoCustomerId,
    subscriptionId: data.subscriptionId,
    subscriptionStatus: data.subscriptionStatus,
    billingPeriod: data.billingPeriod ?? null,
    nextBillingDate: data.nextBillingDate ?? null,
    emailsSentMonth: data.emailsSentMonth,
    emailsSentMonthCount: data.emailsSentMonthCount,
  };
}

export async function listUsers({
  limit,
  cursor,
  email,
}: ListUsersParams): Promise<{ users: AdminUser[]; nextCursor: string | null }> {
  const usersRef = adminDb.collection("users");

  if (email) {
    const snapshot = await usersRef.where("email", "==", email.trim()).limit(limit).get();
    return { users: snapshot.docs.map(mapUser), nextCursor: null };
  }

  let query = usersRef.orderBy("createdAt", "desc").limit(limit + 1);
  if (cursor) {
    const cursorSnap = await usersRef.doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;
  const nextCursor = hasMore ? docs[docs.length - 1].id : null;

  return { users: docs.map(mapUser), nextCursor };
}

export async function getUser(uid: string): Promise<AdminUser | null> {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return mapUser(snap as QueryDocumentSnapshot);
}

export async function listAppsForUser(uid: string): Promise<App[]> {
  const snapshot = await adminDb.collection("apps").where("ownerUid", "==", uid).get();
  return snapshot.docs.map((doc) => {
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
  });
}

export async function listWebhookEventsForUser(dodoCustomerId: string): Promise<AdminWebhookEvent[]> {
  const snapshot = await adminDb
    .collection("dodoWebhookEvents")
    .where("customerId", "==", dodoCustomerId)
    .orderBy("receivedAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, type: data.type, receivedAt: data.receivedAt.toDate().toISOString() };
  });
}

export async function updateUserPlan(
  uid: string,
  plan: Plan,
  subscriptionStatus?: string
): Promise<void> {
  const patch: Record<string, unknown> = { plan, updatedAt: FieldValue.serverTimestamp() };
  if (subscriptionStatus !== undefined) patch.subscriptionStatus = subscriptionStatus;
  await adminDb.collection("users").doc(uid).set(patch, { merge: true });
}
