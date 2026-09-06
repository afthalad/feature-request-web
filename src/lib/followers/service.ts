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

const FOLLOWER_BATCH_SIZE = 500;

// Notifications must reach every follower, so this can't truncate — it walks the collection in
// bounded batches instead of one unbounded read, to avoid a single oversized query.
export async function getFollowerEmails(appId: string, featureId: string): Promise<string[]> {
  const followersRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId)
    .collection("followers");

  const emails: string[] = [];
  let query = followersRef.orderBy("createdAt").limit(FOLLOWER_BATCH_SIZE);

  for (;;) {
    const snapshot = await query.get();
    if (snapshot.empty) break;

    emails.push(...snapshot.docs.map((doc) => doc.data().email as string));
    if (snapshot.docs.length < FOLLOWER_BATCH_SIZE) break;

    query = followersRef
      .orderBy("createdAt")
      .startAfter(snapshot.docs[snapshot.docs.length - 1])
      .limit(FOLLOWER_BATCH_SIZE);
  }

  return emails;
}
