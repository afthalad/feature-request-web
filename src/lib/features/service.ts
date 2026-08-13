import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sendNewFeatureRequestEmail } from "@/lib/email/send";
import { followFeature } from "@/lib/followers/service";
import { checkPlanLimit } from "@/lib/plans/limits";
import type { FeatureStatus, FeatureWithVote } from "@/types";

export class RateLimitError extends Error {}
export class NotFoundError extends Error {}
export class LimitExceededError extends Error {}

const MAX_SUBMITS_PER_DEVICE_PER_DAY = 5;

interface ListFeaturesParams {
  appId: string;
  deviceId: string;
  sort: "top" | "new";
  limit: number;
  cursor: string | null;
}

export async function listFeaturesForApp({
  appId,
  deviceId,
  sort,
  limit,
  cursor,
}: ListFeaturesParams): Promise<{ features: FeatureWithVote[]; nextCursor: string | null }> {
  const featuresRef = adminDb.collection("apps").doc(appId).collection("features");
  let query = featuresRef.orderBy(sort === "top" ? "upvoteCount" : "createdAt", "desc").limit(limit + 1);

  if (cursor) {
    const cursorSnap = await featuresRef.doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;
  const nextCursor = hasMore ? docs[docs.length - 1].id : null;

  const voteRefs = docs.map((doc) => doc.ref.collection("votes").doc(deviceId));
  const followerRefs = docs.map((doc) => doc.ref.collection("followers").doc(deviceId));
  const [voteSnaps, followerSnaps] =
    docs.length > 0
      ? await Promise.all([adminDb.getAll(...voteRefs), adminDb.getAll(...followerRefs)])
      : [[], []];
  const votedIds = new Set(
    voteSnaps.filter((snap) => snap.exists).map((snap) => snap.ref.parent.parent!.id)
  );
  const followedIds = new Set(
    followerSnaps.filter((snap) => snap.exists).map((snap) => snap.ref.parent.parent!.id)
  );

  const features: FeatureWithVote[] = docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description ?? "",
      status: data.status,
      upvoteCount: data.upvoteCount,
      commentCount: data.commentCount ?? 0,
      followerCount: data.followerCount ?? 0,
      authorDeviceId: data.authorDeviceId,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
      hasVoted: votedIds.has(doc.id),
      isFollowing: followedIds.has(doc.id),
    };
  });

  return { features, nextCursor };
}

interface CreateFeatureParams {
  appId: string;
  deviceId: string;
  title: string;
  description: string;
  email?: string;
}

export async function createFeatureForApp({
  appId,
  deviceId,
  title,
  description,
  email,
}: CreateFeatureParams) {
  const appRef = adminDb.collection("apps").doc(appId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new NotFoundError();

  const limitCheck = await checkPlanLimit(appSnap.data()!.ownerUid, "feature", { appId });
  if (!limitCheck.allowed) {
    throw new LimitExceededError(limitCheck.message);
  }

  const featureRef = appRef.collection("features").doc();
  const quotaRef = appRef.collection("quotas").doc(deviceId);
  const today = new Date().toISOString().slice(0, 10);

  await adminDb.runTransaction(async (tx) => {
    const quotaSnap = await tx.get(quotaRef);
    const quotaData = quotaSnap.data();
    const submitsToday = quotaData?.day === today ? quotaData.submitsToday : 0;

    if (submitsToday >= MAX_SUBMITS_PER_DEVICE_PER_DAY) {
      throw new RateLimitError();
    }

    const now = FieldValue.serverTimestamp();
    tx.set(featureRef, {
      title,
      description,
      status: "open" satisfies FeatureStatus,
      upvoteCount: 0,
      commentCount: 0,
      followerCount: 0,
      authorDeviceId: deviceId,
      createdAt: now,
      updatedAt: now,
    });
    tx.set(quotaRef, { day: today, submitsToday: submitsToday + 1 });
    tx.update(appRef, { featureCount: FieldValue.increment(1) });
  });

  if (email) {
    await followFeature(appId, featureRef.id, deviceId, email);
  }

  const featureSnap = await featureRef.get();
  const data = featureSnap.data()!;

  void sendNewFeatureRequestEmail({
    appId,
    title: data.title,
    description: data.description,
    upvoteCount: data.upvoteCount,
  }).catch(console.error);

  return {
    id: featureRef.id,
    title: data.title as string,
    description: data.description as string,
    status: data.status as FeatureStatus,
    upvoteCount: data.upvoteCount as number,
    commentCount: data.commentCount as number,
    followerCount: data.followerCount as number,
    authorDeviceId: data.authorDeviceId as string,
    createdAt: data.createdAt.toDate().toISOString() as string,
    updatedAt: data.updatedAt.toDate().toISOString() as string,
  };
}

export async function voteOnFeature(
  appId: string,
  featureId: string,
  deviceId: string,
  action: "add" | "remove"
): Promise<{ upvoteCount: number; hasVoted: boolean }> {
  const featureRef = adminDb.collection("apps").doc(appId).collection("features").doc(featureId);
  const voteRef = featureRef.collection("votes").doc(deviceId);

  const upvoteCount = await adminDb.runTransaction(async (tx) => {
    const [featureSnap, voteSnap] = await Promise.all([tx.get(featureRef), tx.get(voteRef)]);
    if (!featureSnap.exists) throw new NotFoundError();

    const currentCount: number = featureSnap.data()!.upvoteCount;

    if (action === "add") {
      if (voteSnap.exists) return currentCount;
      tx.set(voteRef, { createdAt: FieldValue.serverTimestamp() });
      tx.update(featureRef, { upvoteCount: FieldValue.increment(1) });
      return currentCount + 1;
    }

    if (!voteSnap.exists) return currentCount;
    tx.delete(voteRef);
    tx.update(featureRef, { upvoteCount: FieldValue.increment(-1) });
    return currentCount - 1;
  });

  return { upvoteCount, hasVoted: action === "add" };
}
