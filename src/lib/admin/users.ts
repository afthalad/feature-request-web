import "server-only";
import { FieldValue, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { deleteApp } from "@/lib/admin/apps";
import { polar, grantsPaidAccess } from "@/lib/polar/client";
import { dodo } from "@/lib/dodo/client";
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
    polarCustomerId: data.polarCustomerId,
    dodoCustomerId: data.dodoCustomerId,
    subscriptionId: data.subscriptionId,
    subscriptionStatus: data.subscriptionStatus,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
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
      deleted: data.deleted === true,
      deletedAt: data.deletedAt ? data.deletedAt.toDate().toISOString() : null,
    };
  });
}

// Polar events are logged by uid; Dodo events (subscribers from before the move to Polar) by
// Dodo customer ID. Both logs are merged, newest first.
export async function listWebhookEventsForUser(user: AdminUser): Promise<AdminWebhookEvent[]> {
  const [polarSnap, dodoSnap] = await Promise.all([
    adminDb
      .collection("polarWebhookEvents")
      .where("uid", "==", user.uid)
      .orderBy("receivedAt", "desc")
      .limit(50)
      .get(),
    user.dodoCustomerId
      ? adminDb
          .collection("dodoWebhookEvents")
          .where("customerId", "==", user.dodoCustomerId)
          .orderBy("receivedAt", "desc")
          .limit(50)
          .get()
      : null,
  ]);

  const toEvent = (provider: AdminWebhookEvent["provider"]) => (doc: QueryDocumentSnapshot) => {
    const data = doc.data();
    return { id: doc.id, provider, type: data.type, receivedAt: data.receivedAt.toDate().toISOString() };
  };

  return [...polarSnap.docs.map(toEvent("polar")), ...(dodoSnap?.docs.map(toEvent("dodo")) ?? [])]
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, 50);
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

// Ends a paid subscription right away so a deleted account stops being billed. subscriptionId is
// Polar's once the user has a Polar customer; otherwise it's a Dodo one from before the move.
async function cancelSubscription(uid: string): Promise<void> {
  const data = (await adminDb.collection("users").doc(uid).get()).data();
  if (!data?.subscriptionId) return;

  if (data.polarCustomerId) {
    if (grantsPaidAccess(data.subscriptionStatus)) {
      await polar.subscriptions.revoke({ id: data.subscriptionId });
    }
  } else if (data.dodoCustomerId && (data.plan === "starter" || data.plan === "pro")) {
    await dodo.subscriptions.update(data.subscriptionId, { status: "cancelled" });
  }
}

// Permanently removes a user: their subscription (cancelled first — if that fails nothing is
// deleted), every app they own (cascading, via deleteApp — features, votes, followers, comments,
// API keys), their Firestore profile doc, and their Firebase Auth account. Irreversible. Returns
// the ids of the apps that were deleted along with the account, for the audit log.
export async function deleteUser(uid: string): Promise<{ deletedAppIds: string[] }> {
  await cancelSubscription(uid);

  const apps = await listAppsForUser(uid);
  for (const app of apps) await deleteApp(app.id);

  await adminDb.collection("users").doc(uid).delete();
  await adminAuth.deleteUser(uid).catch(() => {
    // The Firestore profile can outlive the Auth account (e.g. already removed there) —
    // deleting the profile is what matters for admin visibility, so don't fail the request.
  });

  return { deletedAppIds: apps.map((app) => app.id) };
}
