import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FieldValue } from "firebase-admin/firestore";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { listFeaturesForOwner } from "@/lib/features/service";
import { FeatureList } from "@/components/features/FeatureList";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";
import { ExportReportButton } from "@/components/apps/ExportReportButton";
import { PlatformIcons } from "@/components/apps/PlatformIcons";
import { buttonVariants } from "@/components/ui/button";
import type { Plan } from "@/types";

const FEATURES_PAGE_SIZE = 20;

export default async function AppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  const [user, appSnap] = await Promise.all([
    getSessionUser(),
    adminDb.collection("apps").doc(appId).get(),
  ]);
  if (!user) redirect("/login");
  if (!appSnap.exists || appSnap.data()!.ownerUid !== user.uid) notFound();

  const app = appSnap.data()!;
  const newSinceIso: string | null = app.featuresLastViewedAt
    ? app.featuresLastViewedAt.toDate().toISOString()
    : null;

  const userSnap = await adminDb.collection("users").doc(user.uid).get();
  const userPlan = userSnap.data()?.plan;
  const plan: Plan = userPlan === "pro" || userPlan === "starter" ? userPlan : "free";

  const [{ features, nextCursor, hiddenCount, totalCount }] = await Promise.all([
    listFeaturesForOwner({
      appId,
      tab: "pending",
      limit: FEATURES_PAGE_SIZE,
      cursor: null,
      plan,
      served: 0,
    }),
    adminDb.collection("apps").doc(appId).update({ featuresLastViewedAt: FieldValue.serverTimestamp() }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 truncate text-xl font-semibold">
            {app.name}
            <PlatformIcons platforms={app.platforms ?? []} />
          </h1>
          <p className="text-muted-foreground text-sm">{app.bundleId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {app.slug && (
            <Link
              href={`/b/${app.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "outline" })}
            >
              Public board
            </Link>
          )}
          <ExportReportButton appId={appId} plan={plan} />
          <Link
            href={`/dashboard/apps/${appId}/settings`}
            className={buttonVariants({ variant: "outline" })}
          >
            Settings
          </Link>
        </div>
      </div>
      {plan === "free" && (
        <UpgradeBanner message="Upgrade for a higher feature-request limit on this app." />
      )}
      <FeatureList
        appId={appId}
        slug={app.slug ?? ""}
        initialFeatures={features}
        initialCursor={nextCursor}
        initialHiddenCount={hiddenCount}
        initialTotalCount={totalCount}
        newSinceIso={newSinceIso}
      />
    </div>
  );
}
