import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Inbox, LayoutGrid } from "lucide-react";
import { getSessionUser } from "@/lib/auth/requireUser";
import {
  getOwnedAppsSnapshot,
  getUserSnapshot,
  planFromUserData,
} from "@/lib/dashboard/data";
import {
  getDashboardStats,
  listRecentPendingFeatures,
} from "@/lib/features/service";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import { AppCard } from "@/components/apps/AppCard";
import { NewAppButton } from "@/components/apps/NewAppButton";
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

  // The layout makes the same two reads for the sidebar; these share them (cached per request).
  const [appsSnapshot, userSnapshot] = await Promise.all([
    getOwnedAppsSnapshot(user.uid),
    getUserSnapshot(user.uid),
  ]);
  const plan: Plan = planFromUserData(userSnapshot.data());

  const apps: App[] = appsSnapshot.docs
    .filter((doc) => doc.get("deleted") !== true)
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerUid: data.ownerUid,
        name: data.name,
        iosBundleId: data.iosBundleId ?? null,
        androidPackageName: data.androidPackageName ?? null,
        webDomain: data.webDomain ?? null,
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

  if (apps.length === 0) {
    return (
      <div className="flex min-h-[calc(100svh-10rem)] items-center justify-center">
        <Suspense fallback={null}>
          <CheckoutStatusRefresher plan={plan} />
        </Suspense>
        <EmptyState
          icon={LayoutGrid}
          title="Create your first app"
          description="Get an API key and start collecting feature requests from your users."
          action={
            <Link href="/dashboard/apps/new" className={buttonVariants({ size: "lg" })}>
              Create app
            </Link>
          }
          className="border-0"
        />
      </div>
    );
  }

  const [stats, recentPendingFeatures] = await Promise.all([
    getDashboardStats(apps),
    listRecentPendingFeatures(apps, PLAN_LIMITS[plan].recentPendingLimit, plan),
  ]);

  const maxApps = PLAN_LIMITS[plan].maxApps;
  const atAppLimit = apps.length >= maxApps;
  const appLimitMessage = `You've reached the ${maxApps}-app limit on the ${plan} plan. Upgrade to create more apps.`;

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <CheckoutStatusRefresher plan={plan} />
      </Suspense>

      <DashboardStatsGrid stats={stats} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Your apps</h1>
        <NewAppButton
          atLimit={atAppLimit}
          limitMessage={appLimitMessage}
          className={buttonVariants({ variant: "default" })}
        >
          New App
        </NewAppButton>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
      {plan === "free" && (
        <UpgradeBanner reason="dashboard_banner" message="Upgrade for more apps, higher feature limits, and more monthly emails." />
      )}
      {stats.totalFeatures === 0 && (
        <EmptyState
          icon={Inbox}
          title="Waiting for your first feedback"
          description="When your users share an idea, it will show up here."
        />
      )}
      <RecentPendingFeatures features={recentPendingFeatures} />
    </div>
  );
}
