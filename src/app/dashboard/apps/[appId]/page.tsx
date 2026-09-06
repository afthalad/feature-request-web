import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { listFeaturesForOwner } from "@/lib/features/service";
import { FeatureList } from "@/components/features/FeatureList";
import { buttonVariants } from "@/components/ui/button";

const FEATURES_PAGE_SIZE = 20;

export default async function AppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { appId } = await params;
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists || appSnap.data()!.ownerUid !== user.uid) notFound();

  const app = appSnap.data()!;
  const { features, nextCursor } = await listFeaturesForOwner({
    appId,
    sort: "new",
    limit: FEATURES_PAGE_SIZE,
    cursor: null,
  });

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
      <FeatureList
        appId={appId}
        slug={app.slug ?? ""}
        initialFeatures={features}
        initialCursor={nextCursor}
      />
    </div>
  );
}
