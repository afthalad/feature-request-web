import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export const PLAN_LIMITS = {
  free: { maxApps: 1, maxFeaturesPerApp: 50, recentPendingLimit: 3 },
  starter: { maxApps: 3, maxFeaturesPerApp: 200, recentPendingLimit: 5 },
  pro: { maxApps: 5, maxFeaturesPerApp: Infinity, recentPendingLimit: 10 },
} as const;

export type Plan = "free" | "starter" | "pro";

export interface PlanLimitResult {
  allowed: boolean;
  message?: string;
}

async function getPlan(uid: string): Promise<Plan> {
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const plan = userSnap.data()?.plan;
  return plan === "pro" || plan === "starter" ? plan : "free";
}

export async function checkAppLimit(uid: string): Promise<PlanLimitResult> {
  const plan = await getPlan(uid);
  const limits = PLAN_LIMITS[plan];
  const upgradeHint = plan !== "pro" ? " Upgrade at /pricing for more." : "";

  const appsSnap = await adminDb.collection("apps").where("ownerUid", "==", uid).get();
  if (appsSnap.size >= limits.maxApps) {
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
