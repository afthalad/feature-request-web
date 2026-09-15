import { notFound } from "next/navigation";
import Link from "next/link";
import { getApp } from "@/lib/admin/apps";
import { listFeaturesForOwner } from "@/lib/features/service";
import { Card } from "@/components/ui/card";
import { AdminAppSettingsForm } from "@/components/admin/AdminAppSettingsForm";
import { AdminFeatureList } from "@/components/admin/AdminFeatureList";
import { LinkPendingSpinner } from "@/components/admin/LinkPendingSpinner";

const FEATURES_PAGE_SIZE = 20;

export default async function AdminAppDetailPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  // Independent reads — listFeaturesForOwner only needs the appId, not the app doc — so they
  // run concurrently instead of paying two sequential Firestore round trips.
  const [app, { features, nextCursor }] = await Promise.all([
    getApp(appId),
    listFeaturesForOwner({ appId, tab: "new", limit: FEATURES_PAGE_SIZE, cursor: null }),
  ]);
  if (!app) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{app.name}</h1>
        <p className="text-muted-foreground text-sm">
          <Link
            href={`/admin/users/${app.ownerUid}`}
            className="inline-flex items-center gap-1.5 underline underline-offset-2"
          >
            Owner
            <LinkPendingSpinner />
          </Link>
          {" · "}
          {app.bundleId}
        </p>
      </div>

      <Card className="p-5">
        <AdminAppSettingsForm app={app} />
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Feature requests ({app.featureCount})</h2>
        <AdminFeatureList appId={appId} initialFeatures={features} initialCursor={nextCursor} />
      </div>
    </div>
  );
}
