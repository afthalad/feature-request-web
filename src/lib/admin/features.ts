import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AdminComment, Feature } from "@/types";

export async function getFeature(appId: string, featureId: string): Promise<Feature | null> {
  const snap = await adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId)
    .get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    id: snap.id,
    title: data.title,
    description: data.description ?? "",
    status: data.status,
    upvoteCount: data.upvoteCount,
    commentCount: data.commentCount ?? 0,
    followerCount: data.followerCount ?? 0,
    authorDeviceId: data.authorDeviceId,
    authorIsSubscriber: data.authorIsSubscriber ?? false,
    translation: data.translation ?? null,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

export async function updateFeature(
  appId: string,
  featureId: string,
  patch: Partial<Pick<Feature, "title" | "description" | "status">>
): Promise<void> {
  const featureRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId);
  await featureRef.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteFeature(appId: string, featureId: string): Promise<void> {
  const appRef = adminDb.collection("apps").doc(appId);
  const featureRef = appRef.collection("features").doc(featureId);

  await adminDb.recursiveDelete(featureRef);
  await appRef.update({ featureCount: FieldValue.increment(-1) }).catch(() => {});
}

export async function listCommentsForAdmin(
  appId: string,
  featureId: string
): Promise<AdminComment[]> {
  const snapshot = await adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      authorName: data.authorName,
      deviceId: data.deviceId,
      isDeveloper: data.isDeveloper,
      isDeleted: data.isDeleted === true,
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });
}

export async function hardDeleteComment(
  appId: string,
  featureId: string,
  commentId: string
): Promise<void> {
  const featureRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId);
  const commentRef = featureRef.collection("comments").doc(commentId);

  await adminDb.runTransaction(async (tx) => {
    const commentSnap = await tx.get(commentRef);
    if (!commentSnap.exists) return;
    const wasCounted = commentSnap.data()!.isDeleted !== true;
    tx.delete(commentRef);
    if (wasCounted) tx.update(featureRef, { commentCount: FieldValue.increment(-1) });
  });
}
