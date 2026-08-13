import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export const PLAN_LIMITS = {
  free: { maxApps: 1, maxFeaturesPerApp: 50, maxEmailsPerMonth: 100 },
  pro: { maxApps: 5, maxFeaturesPerApp: Infinity, maxEmailsPerMonth: 2000 },
} as const;

export type Plan = "free" | "pro";
export type PlanLimitType = "app" | "feature" | "email";

export interface PlanLimitResult {
  allowed: boolean;
  message?: string;
}

async function getPlan(uid: string): Promise<Plan> {
  const userSnap = await adminDb.collection("users").doc(uid).get();
  return userSnap.data()?.plan === "pro" ? "pro" : "free";
}

export async function checkPlanLimit(
  uid: string,
  type: PlanLimitType,
  context: { appId?: string; count?: number } = {}
): Promise<PlanLimitResult> {
  const plan = await getPlan(uid);
  const limits = PLAN_LIMITS[plan];
  const upgradeHint = plan === "free" ? " Upgrade at /pricing for more." : "";

  if (type === "app") {
    const appsSnap = await adminDb.collection("apps").where("ownerUid", "==", uid).get();
    if (appsSnap.size >= limits.maxApps) {
      return {
        allowed: false,
        message: `You've reached the ${limits.maxApps}-app limit on the ${plan} plan.${upgradeHint}`,
      };
    }
    return { allowed: true };
  }

  if (type === "feature") {
    if (!context.appId) return { allowed: true };
    const appSnap = await adminDb.collection("apps").doc(context.appId).get();
    const featureCount = appSnap.data()?.featureCount ?? 0;
    if (featureCount >= limits.maxFeaturesPerApp) {
      return {
        allowed: false,
        message: `This app has reached its ${limits.maxFeaturesPerApp}-feature-request limit on the ${plan} plan.${upgradeHint}`,
      };
    }
    return { allowed: true };
  }

  const userRef = adminDb.collection("users").doc(uid);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const count = context.count ?? 1;

  return adminDb.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const data = userSnap.data();
    const sentThisMonth = data?.emailsSentMonth === thisMonth ? data.emailsSentMonthCount : 0;

    if (sentThisMonth + count > limits.maxEmailsPerMonth) {
      return {
        allowed: false,
        message: `You've reached the ${limits.maxEmailsPerMonth}-email/month limit on the ${plan} plan.${upgradeHint}`,
      };
    }

    tx.set(
      userRef,
      { emailsSentMonth: thisMonth, emailsSentMonthCount: sentThisMonth + count },
      { merge: true }
    );
    return { allowed: true };
  });
}
