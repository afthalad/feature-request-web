import "server-only";
import { adminDb } from "@/lib/firebase/admin";

// publicBoard: the web board at /b/<slug>. showBranding: the "Powered by Fewchurs" line in
// the SDK boards (sent to them as /config showBranding).
export const PLAN_LIMITS = {
  free: { maxApps: 1, maxFeaturesPerApp: 5, recentPendingLimit: 3, publicBoard: false, showBranding: true },
  starter: { maxApps: 3, maxFeaturesPerApp: 200, recentPendingLimit: 5, publicBoard: false, showBranding: false },
  pro: { maxApps: 5, maxFeaturesPerApp: Infinity, recentPendingLimit: 10, publicBoard: true, showBranding: false },
} as const;

export type Plan = "free" | "starter" | "pro";

export interface PlanLimitResult {
  allowed: boolean;
  message?: string;
}

/** The user's current plan, read fresh. */
export async function getUserPlan(uid: string): Promise<Plan> {
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const plan = userSnap.data()?.plan;
  return plan === "pro" || plan === "starter" ? plan : "free";
}

// In-app and public boards need the owner's plan on every list request, so warm instances keep
// it briefly. Trade-off: an upgrade or downgrade can take up to PLAN_TTL_MS to reach the boards.
const PLAN_TTL_MS = 60_000;
const MAX_CACHED_PLANS = 500;
const planCache = new Map<string, { plan: Plan; expiresAt: number }>();

/** The app owner's plan, cached per instance for board requests. */
export async function getOwnerPlan(uid: string): Promise<Plan> {
  const cached = planCache.get(uid);
  if (cached && cached.expiresAt > Date.now()) return cached.plan;

  const plan = await getUserPlan(uid);
  planCache.delete(uid);
  if (planCache.size >= MAX_CACHED_PLANS) {
    const oldest = planCache.keys().next().value;
    if (oldest !== undefined) planCache.delete(oldest);
  }
  planCache.set(uid, { plan, expiresAt: Date.now() + PLAN_TTL_MS });
  return plan;
}

export async function checkAppLimit(uid: string): Promise<PlanLimitResult> {
  // Both reads only need `uid`, so they run concurrently. The app count uses a server-side
  // count() aggregate instead of fetching every app doc — we only need `.size`, not the data.
  const [plan, countSnap] = await Promise.all([
    getUserPlan(uid),
    adminDb.collection("apps").where("ownerUid", "==", uid).count().get(),
  ]);
  const limits = PLAN_LIMITS[plan];
  const upgradeHint = plan !== "pro" ? " Upgrade at /pricing for more." : "";

  if (countSnap.data().count >= limits.maxApps) {
    return {
      allowed: false,
      message: `You've reached the ${limits.maxApps}-app limit on the ${plan} plan.${upgradeHint}`,
    };
  }
  return { allowed: true };
}

// Notification-email volume is unlimited on every plan — this just tracks usage for admin
// visibility (see the "Emails sent this month" stat), it never blocks a send.
export async function trackEmailsSent(uid: string, count: number): Promise<void> {
  const userRef = adminDb.collection("users").doc(uid);
  const thisMonth = new Date().toISOString().slice(0, 7);

  await adminDb.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const data = userSnap.data();
    const sentThisMonth = data?.emailsSentMonth === thisMonth ? data.emailsSentMonthCount : 0;

    tx.set(
      userRef,
      { emailsSentMonth: thisMonth, emailsSentMonthCount: sentThisMonth + count },
      { merge: true }
    );
  });
}
