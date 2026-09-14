import "server-only";
import {
  AggregateField,
  FieldValue,
  Timestamp,
  type QueryDocumentSnapshot,
  type Query,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sendNewFeatureRequestEmail } from "@/lib/email/send";
import { followFeature } from "@/lib/followers/service";
import { PLAN_LIMITS, type Plan } from "@/lib/plans/limits";
import { translateText } from "@/lib/translate/googleTranslate";
import type {
  App,
  DashboardStats,
  Feature,
  FeatureStatus,
  FeatureTranslation,
  FeatureWithVote,
  RecentFeature,
} from "@/types";

export class RateLimitError extends Error {}
export class NotFoundError extends Error {}
export class LimitExceededError extends Error {}

const MAX_SUBMITS_PER_DEVICE_PER_DAY = 5;
const APPROVED_STATUSES: FeatureStatus[] = ["planned", "in_progress", "done"];

function mapFeature(doc: QueryDocumentSnapshot): Feature {
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
    authorIsSubscriber: data.authorIsSubscriber ?? false,
    translation: data.translation ?? null,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

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

  const features: FeatureWithVote[] = docs.map((doc) => ({
    ...mapFeature(doc),
    hasVoted: votedIds.has(doc.id),
    isFollowing: followedIds.has(doc.id),
  }));

  return { features, nextCursor };
}

export type OwnerFeatureTab = "top" | "new" | "pending" | "approved";

interface ListFeaturesForOwnerParams {
  appId: string;
  tab: OwnerFeatureTab;
  limit: number;
  cursor: string | null;
  /** Owner's plan, for the pending-tab visibility cap. Defaults to unrestricted (admin views). */
  plan?: Plan;
  /** How many pending items the caller has already been shown, for capping across pages. */
  served?: number;
}

interface ListFeaturesForOwnerResult {
  features: Feature[];
  nextCursor: string | null;
  totalCount: number | null;
  hiddenCount: number;
}

// Owner-facing listing (dashboard): no per-device vote/follow lookups, since the dashboard never
// shows "did I vote on this" — that saves two extra reads per feature vs. listFeaturesForApp.
//
// The pending tab is visibility-capped by plan (PLAN_LIMITS.maxFeaturesPerApp): submissions are
// never blocked (see createFeatureForApp), so an app can collect more pending requests than its
// plan shows — the newest `maxFeaturesPerApp` stay visible and the rest are reported as
// `hiddenCount` so the dashboard can prompt an upgrade instead of turning away feedback.
export async function listFeaturesForOwner({
  appId,
  tab,
  limit,
  cursor,
  plan = "pro",
  served = 0,
}: ListFeaturesForOwnerParams): Promise<ListFeaturesForOwnerResult> {
  const featuresRef = adminDb.collection("apps").doc(appId).collection("features");
  let query: Query = featuresRef;

  if (tab === "pending") query = query.where("status", "==", "open");
  else if (tab === "approved") query = query.where("status", "in", APPROVED_STATUSES);

  let totalCount: number | null = null;
  let hiddenCount = 0;
  const visibleLimit = tab === "pending" ? PLAN_LIMITS[plan].maxFeaturesPerApp : Infinity;

  if (tab === "pending") {
    const countSnap = await query.count().get();
    totalCount = countSnap.data().count;

    if (Number.isFinite(visibleLimit)) {
      hiddenCount = Math.max(0, totalCount - visibleLimit);
      const remaining = Math.max(0, visibleLimit - served);
      if (remaining === 0) {
        return { features: [], nextCursor: null, totalCount, hiddenCount };
      }
      limit = Math.min(limit, remaining);
    }
  }

  query = query.orderBy(tab === "top" ? "upvoteCount" : "createdAt", "desc").limit(limit + 1);

  if (cursor) {
    const cursorSnap = await featuresRef.doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;
  let nextCursor = hasMore ? docs[docs.length - 1].id : null;

  if (nextCursor && Number.isFinite(visibleLimit) && served + docs.length >= visibleLimit) {
    nextCursor = null;
  }

  return { features: docs.map(mapFeature), nextCursor, totalCount, hiddenCount };
}

// Newest pending (unreviewed) features across all of an owner's apps, for the dashboard preview.
export async function listRecentPendingFeatures(
  apps: App[],
  limit: number
): Promise<RecentFeature[]> {
  if (apps.length === 0) return [];

  const perAppSnapshots = await Promise.all(
    apps.map((app) =>
      adminDb
        .collection("apps")
        .doc(app.id)
        .collection("features")
        .where("status", "==", "open")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get()
    )
  );

  const features = perAppSnapshots.flatMap((snapshot, index) => {
    const app = apps[index];
    return snapshot.docs.map((doc) => {
      const feature = mapFeature(doc);
      return {
        ...feature,
        appId: app.id,
        appName: app.name,
        isNew: !app.featuresLastViewedAt || feature.createdAt > app.featuresLastViewedAt,
      };
    });
  });

  return features.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getDashboardStats(apps: App[]): Promise<DashboardStats> {
  const totalFeatures = apps.reduce((sum, app) => sum + (app.featureCount ?? 0), 0);

  const upvoteTotals = await Promise.all(
    apps.map((app) =>
      adminDb
        .collection("apps")
        .doc(app.id)
        .collection("features")
        .aggregate({ upvotes: AggregateField.sum("upvoteCount") })
        .get()
    )
  );

  const totalUpvotes = upvoteTotals.reduce((sum, snap) => sum + (snap.data().upvotes ?? 0), 0);

  return { totalApps: apps.length, totalFeatures, totalUpvotes };
}

interface CreateFeatureParams {
  appId: string;
  deviceId: string;
  title: string;
  description: string;
  email?: string;
  isSubscriber?: boolean;
}

export async function createFeatureForApp({
  appId,
  deviceId,
  title,
  description,
  email,
  isSubscriber,
}: CreateFeatureParams) {
  const appRef = adminDb.collection("apps").doc(appId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new NotFoundError();

  // Submissions are never turned away for volume — the plan's feature-request cap now limits
  // how many are visible in the owner's dashboard (see listFeaturesForOwner), not whether an
  // end user's feedback gets captured at all.
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
      authorIsSubscriber: isSubscriber ?? false,
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
    submitterEmail: email,
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
    authorIsSubscriber: data.authorIsSubscriber as boolean,
    translation: null,
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

// Rolling-window listing for CSV export (owner-facing report), uncapped by tab/status.
export async function exportFeaturesForApp({
  appId,
  since,
}: {
  appId: string;
  since: Date;
}): Promise<Feature[]> {
  const featuresRef = adminDb.collection("apps").doc(appId).collection("features");
  const snapshot = await featuresRef
    .where("createdAt", ">=", Timestamp.fromDate(since))
    .orderBy("createdAt", "desc")
    .limit(2000)
    .get();

  return snapshot.docs.map(mapFeature);
}

// On-demand translation, cached on the feature doc so re-clicking "Translate" for the same
// target language doesn't re-call the (paid) translation API.
export async function translateFeature({
  appId,
  featureId,
  targetLang,
}: {
  appId: string;
  featureId: string;
  targetLang: string;
}): Promise<FeatureTranslation> {
  const featureRef = adminDb.collection("apps").doc(appId).collection("features").doc(featureId);
  const featureSnap = await featureRef.get();
  if (!featureSnap.exists) throw new NotFoundError();

  const data = featureSnap.data()!;
  const cached = data.translation as FeatureTranslation | undefined;
  if (cached && cached.lang === targetLang) return cached;

  const [titleResult, descriptionResult] = await Promise.all([
    translateText(data.title as string, targetLang),
    translateText((data.description as string | undefined) ?? "", targetLang),
  ]);

  const translation: FeatureTranslation = {
    lang: targetLang,
    title: titleResult.translatedText,
    description: descriptionResult.translatedText,
  };

  await featureRef.update({ translation });
  return translation;
}

// Recursively removes the feature doc plus its votes/followers/comments subcollections, and
// decrements the app's featureCount. Irreversible — the caller is expected to confirm first.
export async function deleteFeature(appId: string, featureId: string): Promise<void> {
  const appRef = adminDb.collection("apps").doc(appId);
  const featureRef = appRef.collection("features").doc(featureId);

  const featureSnap = await featureRef.get();
  if (!featureSnap.exists) throw new NotFoundError();

  await adminDb.recursiveDelete(featureRef);
  await appRef.update({ featureCount: FieldValue.increment(-1) });
}
