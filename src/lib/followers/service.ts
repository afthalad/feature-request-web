import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export class NotFoundError extends Error {}

export async function followFeature(
  appId: string,
  featureId: string,
  deviceId: string,
  email: string
): Promise<void> {
  const featureRef = adminDb.collection("apps").doc(appId).collection("features").doc(featureId);
  const followerRef = featureRef.collection("followers").doc(deviceId);

  await adminDb.runTransaction(async (tx) => {
    const [featureSnap, followerSnap] = await Promise.all([
      tx.get(featureRef),
      tx.get(followerRef),
    ]);
    if (!featureSnap.exists) throw new NotFoundError();
    if (followerSnap.exists) return;

    tx.set(followerRef, { email: email.toLowerCase().trim(), createdAt: FieldValue.serverTimestamp() });
    tx.update(featureRef, { followerCount: FieldValue.increment(1) });
  });
}

export async function unfollowFeature(
  appId: string,
  featureId: string,
  deviceId: string
): Promise<void> {
  const featureRef = adminDb.collection("apps").doc(appId).collection("features").doc(featureId);
  const followerRef = featureRef.collection("followers").doc(deviceId);

  await adminDb.runTransaction(async (tx) => {
    const [featureSnap, followerSnap] = await Promise.all([
      tx.get(featureRef),
      tx.get(followerRef),
    ]);
    if (!featureSnap.exists) throw new NotFoundError();
    if (!followerSnap.exists) return;

    tx.delete(followerRef);
    tx.update(featureRef, { followerCount: FieldValue.increment(-1) });
  });
}

export async function isFollowing(
  appId: string,
  featureId: string,
  deviceId: string
): Promise<boolean> {
  const followerSnap = await adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId)
    .collection("followers")
    .doc(deviceId)
    .get();
  return followerSnap.exists;
}

export async function getFollowerEmails(appId: string, featureId: string): Promise<string[]> {
  const snapshot = await adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId)
    .collection("followers")
    .get();

  return snapshot.docs.map((doc) => doc.data().email as string);
}
