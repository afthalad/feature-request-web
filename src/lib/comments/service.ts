import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Comment } from "@/types";

export class RateLimitError extends Error {}
export class NotFoundError extends Error {}

const MAX_COMMENTS_PER_DEVICE_PER_DAY = 10;
const DEFAULT_AUTHOR_NAME = "App User";

export async function listCommentsForFeature(appId: string, featureId: string): Promise<Comment[]> {
  const snapshot = await adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId)
    .collection("comments")
    .where("isDeleted", "==", false)
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text as string,
        authorName: data.authorName as string,
        deviceId: data.deviceId as string,
        isDeveloper: data.isDeveloper as boolean,
        createdAt: data.createdAt.toDate().toISOString() as string,
      };
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

interface CreateCommentParams {
  appId: string;
  featureId: string;
  deviceId: string;
  text: string;
  authorName?: string;
  isDeveloper: boolean;
}

export async function createComment({
  appId,
  featureId,
  deviceId,
  text,
  authorName,
  isDeveloper,
}: CreateCommentParams): Promise<Comment> {
  const appRef = adminDb.collection("apps").doc(appId);
  const featureRef = appRef.collection("features").doc(featureId);
  const commentRef = featureRef.collection("comments").doc();
  const quotaRef = appRef.collection("commentQuotas").doc(deviceId);
  const today = new Date().toISOString().slice(0, 10);

  await adminDb.runTransaction(async (tx) => {
    const featureSnap = await tx.get(featureRef);
    if (!featureSnap.exists) throw new NotFoundError();

    if (!isDeveloper) {
      const quotaSnap = await tx.get(quotaRef);
      const quotaData = quotaSnap.data();
      const commentsToday = quotaData?.day === today ? quotaData.commentsToday : 0;

      if (commentsToday >= MAX_COMMENTS_PER_DEVICE_PER_DAY) {
        throw new RateLimitError();
      }
      tx.set(quotaRef, { day: today, commentsToday: commentsToday + 1 });
    }

    tx.set(commentRef, {
      text,
      authorName: authorName?.trim() || DEFAULT_AUTHOR_NAME,
      deviceId,
      isDeveloper,
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
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function deleteComment(
  appId: string,
  featureId: string,
  commentId: string
): Promise<void> {
  const featureRef = adminDb.collection("apps").doc(appId).collection("features").doc(featureId);
  const commentRef = featureRef.collection("comments").doc(commentId);

  await adminDb.runTransaction(async (tx) => {
    const commentSnap = await tx.get(commentRef);
    if (!commentSnap.exists || commentSnap.data()!.isDeleted) throw new NotFoundError();

    tx.update(commentRef, { isDeleted: true });
    tx.update(featureRef, { commentCount: FieldValue.increment(-1) });
  });
}
