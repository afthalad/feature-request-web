import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FieldValue } from "firebase-admin/firestore";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { listFeaturesForOwner } from "@/lib/features/service";
import { FeatureList } from "@/components/features/FeatureList";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";
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

  const [userSnap, { features, nextCursor }] = await Promise.all([
    adminDb.collection("users").doc(user.uid).get(),
    listFeaturesForOwner({ appId, tab: "pending", limit: FEATURES_PAGE_SIZE, cursor: null }),
    adminDb.collection("apps").doc(appId).update({ featuresLastViewedAt: FieldValue.serverTimestamp() }),
  ]);
  const userPlan = userSnap.data()?.plan;
  const plan: Plan = userPlan === "pro" || userPlan === "starter" ? userPlan : "free";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{app.name}</h1>
          <p className="text-muted-foreground text-sm">{app.bundleId}</p>
        </div>
        <div className="flex gap-2">
          {app.slug && (
            <Link
              href={`/b/${app.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "outline" })}
            >
              Public board
            </Link>
          )}
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
        newSinceIso={newSinceIso}
      />
    </div>
  );
}
