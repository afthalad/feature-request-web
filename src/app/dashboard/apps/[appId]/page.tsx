import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FieldValue } from "firebase-admin/firestore";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { getUserSnapshot, planFromUserData } from "@/lib/dashboard/data";
import { listFeaturesForOwner } from "@/lib/features/service";
import { FeatureList } from "@/components/features/FeatureList";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";
import { ExportReportButton } from "@/components/apps/ExportReportButton";
import { PlatformIcons } from "@/components/apps/PlatformIcons";
import { listAppPlatforms, readAppIds } from "@/lib/apps/appIds";
import { buttonVariants } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import type { Plan } from "@/types";

const FEATURES_PAGE_SIZE = 20;

export default async function AppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  // The plan read starts as soon as the session is known (and is shared with the layout's
  // sidebar read), instead of waiting for the app document first.
  const userPromise = getSessionUser();
  const [user, appSnap, userSnap] = await Promise.all([
    userPromise,
    adminDb.collection("apps").doc(appId).get(),
    userPromise.then((u) => (u ? getUserSnapshot(u.uid) : null)),
  ]);
  if (!user) redirect("/login");
  if (
    !appSnap.exists ||
    appSnap.data()!.ownerUid !== user.uid ||
    appSnap.get("deleted") === true
  ) {
    notFound();
  }

  const app = appSnap.data()!;
  const newSinceIso: string | null = app.featuresLastViewedAt
    ? app.featuresLastViewedAt.toDate().toISOString()
    : null;

  const plan: Plan = planFromUserData(userSnap?.data());
  const hasPublicBoard = PLAN_LIMITS[plan].publicBoard;
  const appPlatforms = listAppPlatforms(readAppIds(app));
  const requestPlatforms =
    hasPublicBoard && !appPlatforms.includes("web") ? [...appPlatforms, "web" as const] : appPlatforms;

  const [{ features, nextCursor, hiddenCount }] = await Promise.all([
    listFeaturesForOwner({
      appId,
      status: "all",
      sort: "newest",
      limit: FEATURES_PAGE_SIZE,
      cursor: null,
      plan,
    }),
    adminDb
      .collection("apps")
      .doc(appId)
      .update({ featuresLastViewedAt: FieldValue.serverTimestamp() }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 truncate text-xl font-semibold">
            {app.name}
            <PlatformIcons platforms={listAppPlatforms(readAppIds(app))} />
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {app.slug && hasPublicBoard && (
            <Link
              href={`/b/${app.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "secondary" })}
            >
              Public board
            </Link>
          )}
          {!hasPublicBoard && (
            <Link
              href="/pricing"
              className={buttonVariants({ variant: "secondary" })}
            >
              Public board
              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none">
                Pro
              </span>
            </Link>
          )}
          <ExportReportButton appId={appId} plan={plan} />
          <Link
            href={`/dashboard/apps/${appId}/settings`}
            className={buttonVariants({ variant: "secondary" })}
          >
            Settings
          </Link>
        </div>
      </div>

      <FeatureList
        appId={appId}
        slug={hasPublicBoard ? (app.slug ?? "") : ""}
        initialFeatures={features}
        initialCursor={nextCursor}
        initialHiddenCount={hiddenCount}
        newSinceIso={newSinceIso}
        platforms={requestPlatforms}
      />
    </div>
  );
}
