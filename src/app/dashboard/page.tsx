import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import {
  getDashboardStats,
  listRecentPendingFeatures,
} from "@/lib/features/service";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import { AppCard } from "@/components/apps/AppCard";
import { RecentPendingFeatures } from "@/components/apps/RecentPendingFeatures";

import { CheckoutStatusRefresher } from "@/components/billing/CheckoutStatusRefresher";
import { DashboardStatsGrid } from "@/components/billing/DashboardStatsGrid";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { App, Plan } from "@/types";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [appsSnapshot, userSnapshot] = await Promise.all([
    adminDb.collection("apps").where("ownerUid", "==", user.uid).get(),
    adminDb.collection("users").doc(user.uid).get(),
  ]);
  const userData = userSnapshot.data();
  const plan: Plan =
    userData?.plan === "pro" || userData?.plan === "starter"
      ? userData.plan
      : "free";

  const apps: App[] = appsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerUid: data.ownerUid,
        name: data.name,
        bundleId: data.bundleId,
        slug: data.slug ?? "",
        apiKeyPrefix: data.apiKeyPrefix,
        notificationEmail: data.notificationEmail,
        emailOnNewRequest: data.emailOnNewRequest,
        featureCount: data.featureCount,
        createdAt: data.createdAt.toDate().toISOString(),
        featuresLastViewedAt: data.featuresLastViewedAt
          ? data.featuresLastViewedAt.toDate().toISOString()
          : null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const [stats, recentPendingFeatures] = await Promise.all([
    getDashboardStats(apps),
    listRecentPendingFeatures(apps, PLAN_LIMITS[plan].recentPendingLimit),
  ]);

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <CheckoutStatusRefresher plan={plan} />
      </Suspense>

      <DashboardStatsGrid stats={stats} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your apps</h1>
        <Link
          href="/dashboard/apps/new"
          className={buttonVariants({ variant: "default" })}
        >
          New App
        </Link>
      </div>
      {apps.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No apps yet"
          description="Create your first app to get an API key and start collecting feature requests."
          action={
            <Link href="/dashboard/apps/new" className={buttonVariants()}>
              Create your first app
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
      {plan === "free" && (
        <UpgradeBanner message="Upgrade for more apps, higher feature limits, and more monthly emails." />
      )}
      <RecentPendingFeatures features={recentPendingFeatures} />
    </div>
  );
}
