import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { FeatureList } from "@/components/features/FeatureList";
import { buttonVariants } from "@/components/ui/button";
import type { Feature } from "@/types";

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
  const featuresSnapshot = await appSnap.ref.collection("features").get();
  const features: Feature[] = featuresSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description ?? "",
      status: data.status,
      upvoteCount: data.upvoteCount,
      commentCount: data.commentCount ?? 0,
      followerCount: data.followerCount ?? 0,
      authorDeviceId: data.authorDeviceId,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
    };
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
      <FeatureList appId={appId} slug={app.slug ?? ""} initialFeatures={features} />
    </div>
  );
}
