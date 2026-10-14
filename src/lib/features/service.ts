import "server-only";
import { after } from "next/server";
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
import type { Plan } from "@/lib/plans/limits";
import {
  forgetVisibleIds,
  getVisibleIds,
  getVisibleWindow,
  isLocked,
  visibleLimit,
} from "@/lib/plans/visibility";
import { maskText } from "@/lib/email/mask";
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

const MAX_SUBMITS_PER_DEVICE_PER_DAY = 15;
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
  /** Roadmap views ask for a subset; omitted means every status. */
  statuses?: FeatureStatus[];
  /** App owner's plan. Boards list only the requests it shows; omitted means all of them. */
  plan?: Plan;
}

// Locked dashboard rows carry only what a placeholder needs, never the request's text, so the
// paywall can't be read around in the browser's network tab.
function lockFeature<T extends Feature>(feature: T): T {
  return {
    ...feature,
    title: maskText(feature.title),
    description: "",
    authorDeviceId: "",
    translation: null,
    locked: true,
  };
}

export async function listFeaturesForApp({
  appId,
  deviceId,
  sort,
  limit,
  cursor,
  statuses,
  plan,
}: ListFeaturesParams): Promise<{
  features: FeatureWithVote[];
  nextCursor: string | null;
}> {
  const featuresRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features");
  let docs: QueryDocumentSnapshot[];
  let nextCursor: string | null;
  // Boards only ever see the plan's visible requests (the app's first N), chosen here on the
  // server, so no cursor or crafted request can reach the locked ones. That window is at most
  // the plan's limit, so it's filtered, ranked and paged in memory.
  const window = plan ? await getVisibleWindow(appId, plan) : null;
  if (window) {
    const rows = (statuses?.length
      ? window.filter((doc) => statuses.includes(doc.get("status")))
      : [...window]
    ).sort((a, b) =>
      sort === "top"
        ? (b.get("upvoteCount") ?? 0) - (a.get("upvoteCount") ?? 0) || b.id.localeCompare(a.id)
        : b.get("createdAt").valueOf().localeCompare(a.get("createdAt").valueOf()) ||
          b.id.localeCompare(a.id),
    );
    const start = cursor ? rows.findIndex((doc) => doc.id === cursor) + 1 : 0;
    docs = rows.slice(start, start + limit);
    nextCursor = start + limit < rows.length ? docs[docs.length - 1].id : null;
  } else {
    const filtered: Query = statuses?.length
      ? featuresRef.where("status", "in", statuses)
      : featuresRef;
    let query = filtered
      .orderBy(sort === "top" ? "upvoteCount" : "createdAt", "desc")
      .limit(limit + 1);
    if (cursor) {
      const cursorSnap = await featuresRef.doc(cursor).get();
      if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    }
    const snapshot = await query.get();
    docs = snapshot.docs.slice(0, limit);
    nextCursor = snapshot.docs.length > limit ? docs[docs.length - 1].id : null;
  }

  const voteRefs = docs.map((doc) => doc.ref.collection("votes").doc(deviceId));
  const followerRefs = docs.map((doc) =>
    doc.ref.collection("followers").doc(deviceId),
  );
  const [voteSnaps, followerSnaps] =
    docs.length > 0
      ? await Promise.all([
          adminDb.getAll(...voteRefs),
          adminDb.getAll(...followerRefs),
        ])
      : [[], []];
  const votedIds = new Set(
    voteSnaps
      .filter((snap) => snap.exists)
      .map((snap) => snap.ref.parent.parent!.id),
  );
  const followedIds = new Set(
    followerSnaps
      .filter((snap) => snap.exists)
      .map((snap) => snap.ref.parent.parent!.id),
  );

  const features: FeatureWithVote[] = docs.map((doc) => {
    const feature = mapFeature(doc);
    return {
      ...feature,
      hasVoted: votedIds.has(doc.id),
      isFollowing: followedIds.has(doc.id),
      isMine: feature.authorDeviceId === deviceId,
    };
  });

  return { features, nextCursor };
}

// Single feature for SDK deep links and per-request pages, with the same vote/follow state
// the list gives, so a detail view does not have to page the list to find one row.
// A request the plan locks reads as not found, except to the device that submitted it.
export async function getFeatureForApp({
  appId,
  featureId,
  deviceId,
  plan,
}: {
  appId: string;
  featureId: string;
  deviceId: string;
  plan?: Plan;
}): Promise<FeatureWithVote> {
  const featureRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId);

  const [featureSnap, voteSnap, followerSnap, visibleIds] = await Promise.all([
    featureRef.get(),
    featureRef.collection("votes").doc(deviceId).get(),
    featureRef.collection("followers").doc(deviceId).get(),
    plan ? getVisibleIds(appId, plan) : Promise.resolve(null),
  ]);

  if (!featureSnap.exists) throw new NotFoundError();

  const feature = mapFeature(featureSnap as QueryDocumentSnapshot);
  const isMine = feature.authorDeviceId === deviceId;
  if (!isMine && isLocked(featureId, visibleIds)) {
    throw new NotFoundError();
  }
  return {
    ...feature,
    hasVoted: voteSnap.exists,
    isFollowing: followerSnap.exists,
    isMine,
  };
}

export type OwnerFeatureTab = "top" | "new" | "pending" | "approved";

interface ListFeaturesForOwnerParams {
  appId: string;
  tab: OwnerFeatureTab;
  limit: number;
  cursor: string | null;
  /** Owner's plan, for locking requests past its limit. Defaults to unrestricted (admin views). */
  plan?: Plan;
}

interface ListFeaturesForOwnerResult {
  features: Feature[];
  nextCursor: string | null;
  totalCount: number | null;
  /** Requests in this app the plan locks (across all tabs). */
  hiddenCount: number;
}

// Owner-facing listing (dashboard): no per-device vote/follow lookups, since the dashboard never
// shows "did I vote on this" — that saves two extra reads per feature vs. listFeaturesForApp.
//
// Every request is listed, but on Free and Starter only the app's first N (PLAN_LIMITS
// .maxFeaturesPerApp) come back readable; the rest are locked placeholders (see lockFeature)
// and counted in `hiddenCount`, so the dashboard can prompt an upgrade. Submissions are never
// blocked (see createFeatureForApp), so no feedback is turned away meanwhile.
export async function listFeaturesForOwner({
  appId,
  tab,
  limit,
  cursor,
  plan = "pro",
}: ListFeaturesForOwnerParams): Promise<ListFeaturesForOwnerResult> {
  const featuresRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features");
  let query: Query = featuresRef;

  if (tab === "pending") query = query.where("status", "==", "open");
  else if (tab === "approved")
    query = query.where("status", "in", APPROVED_STATUSES);

  const [visibleIds, totalCount, appTotal] = await Promise.all([
    getVisibleIds(appId, plan),
    tab === "pending"
      ? query.count().get().then((snap) => snap.data().count)
      : Promise.resolve(null),
    Number.isFinite(visibleLimit(plan))
      ? featuresRef.count().get().then((snap) => snap.data().count)
      : Promise.resolve(0),
  ]);
  const hiddenCount = visibleIds ? Math.max(0, appTotal - visibleLimit(plan)) : 0;

  query = query
    .orderBy(tab === "top" ? "upvoteCount" : "createdAt", "desc")
    .limit(limit + 1);

  if (cursor) {
    const cursorSnap = await featuresRef.doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;
  const nextCursor = hasMore ? docs[docs.length - 1].id : null;

  return {
    features: docs.map((doc) => {
      const feature = mapFeature(doc);
      return isLocked(doc.id, visibleIds) ? lockFeature(feature) : feature;
    }),
    nextCursor,
    totalCount,
    hiddenCount,
  };
}

// Newest pending (unreviewed) features across all of an owner's apps, for the dashboard preview.
// Requests past the owner's plan limit come back locked, as in listFeaturesForOwner.
export async function listRecentPendingFeatures(
  apps: App[],
  limit: number,
  plan: Plan = "pro",
): Promise<RecentFeature[]> {
  if (apps.length === 0) return [];

  const perApp = await Promise.all(
    apps.map((app) =>
      Promise.all([
        adminDb
          .collection("apps")
          .doc(app.id)
          .collection("features")
          .where("status", "==", "open")
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get(),
        getVisibleIds(app.id, plan),
      ]),
    ),
  );

  const features = perApp.flatMap(([snapshot, visibleIds], index) => {
    const app = apps[index];
    return snapshot.docs.map((doc) => {
      const mapped = mapFeature(doc);
      const feature = isLocked(doc.id, visibleIds) ? lockFeature(mapped) : mapped;
      return {
        ...feature,
        appId: app.id,
        appName: app.name,
        isNew:
          !app.featuresLastViewedAt ||
          feature.createdAt > app.featuresLastViewedAt,
      };
    });
  });

  return features
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getDashboardStats(apps: App[]): Promise<DashboardStats> {
  const totalFeatures = apps.reduce(
    (sum, app) => sum + (app.featureCount ?? 0),
    0,
  );

  const upvoteTotals = await Promise.all(
    apps.map((app) =>
      adminDb
        .collection("apps")
        .doc(app.id)
        .collection("features")
        .aggregate({ upvotes: AggregateField.sum("upvoteCount") })
        .get(),
    ),
  );

  const totalUpvotes = upvoteTotals.reduce(
    (sum, snap) => sum + (snap.data().upvotes ?? 0),
    0,
  );

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

  // Fire-and-forget alone isn't safe on Vercel — the serverless function can freeze right after
  // the response is sent, killing this promise before the Resend API call completes. after()
  // keeps the function alive until it settles.
  console.log(`[email] queuing new-feature-request email for app ${appId}, feature ${featureRef.id}`);
  after(() =>
    sendNewFeatureRequestEmail({
      appId,
      title: data.title,
      description: data.description,
      upvoteCount: data.upvoteCount,
      submitterEmail: email,
    })
      .then(() => console.log(`[email] new-feature-request email settled for app ${appId}, feature ${featureRef.id}`))
      .catch((error) => console.error(`[email] new-feature-request email FAILED for app ${appId}, feature ${featureRef.id}:`, error)),
  );

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
  action: "add" | "remove",
): Promise<{ upvoteCount: number; hasVoted: boolean }> {
  const featureRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId);
  const voteRef = featureRef.collection("votes").doc(deviceId);

  const upvoteCount = await adminDb.runTransaction(async (tx) => {
    const [featureSnap, voteSnap] = await Promise.all([
      tx.get(featureRef),
      tx.get(voteRef),
    ]);
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
  const featuresRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features");
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
  const featureRef = adminDb
    .collection("apps")
    .doc(appId)
    .collection("features")
    .doc(featureId);
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
export async function deleteFeature(
  appId: string,
  featureId: string,
): Promise<void> {
  const appRef = adminDb.collection("apps").doc(appId);
  const featureRef = appRef.collection("features").doc(featureId);

  const featureSnap = await featureRef.get();
  if (!featureSnap.exists) throw new NotFoundError();

  await adminDb.recursiveDelete(featureRef);
  await appRef.update({ featureCount: FieldValue.increment(-1) });
  // Deleting one of the visible requests unlocks the next one.
  forgetVisibleIds(appId);
}
