import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Comment } from "@/types";

export class RateLimitError extends Error {}
export class NotFoundError extends Error {}

const MAX_COMMENTS_PER_DEVICE_PER_DAY = 10;
const DEFAULT_AUTHOR_NAME = "App User";

interface ListCommentsParams {
  appId: string;
  featureId: string;
  limit: number;
  cursor: string | null;
}

export async function listCommentsForFeature({
  appId,
  featureId,
  limit,
  cursor,
}: ListCommentsParams): Promise<{ comments: Comment[]; nextCursor: string | null }> {
  const commentsRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId)
    .collection("comments");

  // Ordered by createdAt only (no isDeleted filter) so this never needs a composite index —
  // deleted comments are filtered out in memory after the page is fetched.
  let query = commentsRef.orderBy("createdAt", "asc").limit(limit + 1);
  if (cursor) {
    const cursorSnap = await commentsRef.doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;
  const nextCursor = hasMore ? docs[docs.length - 1].id : null;

  const comments = docs
    .filter((doc) => doc.data().isDeleted !== true)
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
    });

  return { comments, nextCursor };
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
