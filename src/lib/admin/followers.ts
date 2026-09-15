import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export class NotFoundError extends Error {}

// Admin-added follower — e.g. subscribing a stakeholder's email to status updates on a feature
// they didn't submit themselves. Unlike the public follow flow, this isn't keyed by deviceId
// (an admin isn't a device), so it gets an auto-generated doc id.
export async function addFollowerAdmin(
  appId: string,
  featureId: string,
  email: string
): Promise<{ id: string; email: string; createdAt: string }> {
  const featureRef = adminDb.collection("apps").doc(appId).collection("features").doc(featureId);
  const followerRef = featureRef.collection("followers").doc();

  await adminDb.runTransaction(async (tx) => {
    const featureSnap = await tx.get(featureRef);
    if (!featureSnap.exists) throw new NotFoundError();

    tx.set(followerRef, { email: email.toLowerCase().trim(), createdAt: FieldValue.serverTimestamp() });
    tx.update(featureRef, { followerCount: FieldValue.increment(1) });
  });

  const snap = await followerRef.get();
  const data = snap.data()!;
  return { id: followerRef.id, email: data.email, createdAt: data.createdAt.toDate().toISOString() };
}

export async function removeFollowerAdmin(
  appId: string,
  featureId: string,
  followerId: string
): Promise<void> {
  const featureRef = adminDb.collection("apps").doc(appId).collection("features").doc(featureId);
  const followerRef = featureRef.collection("followers").doc(followerId);

  await adminDb.runTransaction(async (tx) => {
    const followerSnap = await tx.get(followerRef);
    if (!followerSnap.exists) throw new NotFoundError();

    tx.delete(followerRef);
    tx.update(featureRef, { followerCount: FieldValue.increment(-1) });
  });
}
