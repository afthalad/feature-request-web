import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AdminComment, Feature, FeatureStatus } from "@/types";

export class NotFoundError extends Error {}

interface CreateFeatureAdminParams {
  appId: string;
  adminUid: string;
  title: string;
  description: string;
  status: FeatureStatus;
}

// Admin-authored feature request — e.g. logging something reported outside the board. Skips the
// end-user submit quota and plan visibility cap that gate createFeatureForApp.
export async function createFeatureAdmin({
  appId,
  adminUid,
  title,
  description,
  status,
}: CreateFeatureAdminParams): Promise<Feature> {
  const appRef = adminDb.collection("apps").doc(appId);
  const featureRef = appRef.collection("features").doc();

  await adminDb.runTransaction(async (tx) => {
    const appSnap = await tx.get(appRef);
    if (!appSnap.exists) throw new NotFoundError();

    const now = FieldValue.serverTimestamp();
    tx.set(featureRef, {
      title,
      description,
      status,
      upvoteCount: 0,
      commentCount: 0,
      followerCount: 0,
      authorDeviceId: `admin:${adminUid}`,
      authorIsSubscriber: false,
      createdAt: now,
      updatedAt: now,
    });
    tx.update(appRef, { featureCount: FieldValue.increment(1) });
  });

  const feature = await getFeature(appId, featureRef.id);
  if (!feature) throw new NotFoundError();
  return feature;
}

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

interface CreateCommentAdminParams {
  appId: string;
  featureId: string;
  adminUid: string;
  text: string;
  authorName?: string;
}

// Admin-authored comment, posted as a developer reply. Skips the per-device daily comment quota
// that gates the end-user/owner createComment flow.
export async function createCommentAdmin({
  appId,
  featureId,
  adminUid,
  text,
  authorName,
}: CreateCommentAdminParams): Promise<AdminComment> {
  const featureRef = adminDb.collection("apps").doc(appId).collection("features").doc(featureId);
  const commentRef = featureRef.collection("comments").doc();

  await adminDb.runTransaction(async (tx) => {
    const featureSnap = await tx.get(featureRef);
    if (!featureSnap.exists) throw new NotFoundError();

    tx.set(commentRef, {
      text,
      authorName: authorName?.trim() || "Admin",
      deviceId: `admin:${adminUid}`,
      isDeveloper: true,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(featureRef, { commentCount: FieldValue.increment(1) });
  });

  const commentSnap = await commentRef.get();
  const data = commentSnap.data()!;
  return {
    id: commentRef.id,
    text: data.text,
    authorName: data.authorName,
    deviceId: data.deviceId,
    isDeveloper: data.isDeveloper,
    isDeleted: false,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function updateComment(
  appId: string,
  featureId: string,
  commentId: string,
  text: string
): Promise<void> {
  const commentRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId)
    .collection("comments")
    .doc(commentId);

  const snap = await commentRef.get();
  if (!snap.exists) throw new NotFoundError();

  await commentRef.update({ text });
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
