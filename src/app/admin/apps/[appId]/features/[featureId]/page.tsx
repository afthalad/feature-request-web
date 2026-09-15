import { notFound } from "next/navigation";
import { getFeature, listCommentsForAdmin } from "@/lib/admin/features";
import { listFollowersForFeature } from "@/lib/followers/service";
import { AdminFeatureDetail } from "@/components/admin/AdminFeatureDetail";

const FOLLOWERS_PAGE_SIZE = 20;

export default async function AdminFeatureDetailPage({
  params,
}: {
  params: Promise<{ appId: string; featureId: string }>;
}) {
  const { appId, featureId } = await params;
  const feature = await getFeature(appId, featureId);
  if (!feature) notFound();

  const [comments, followersResult] = await Promise.all([
    listCommentsForAdmin(appId, featureId),
    listFollowersForFeature({ appId, featureId, limit: FOLLOWERS_PAGE_SIZE, cursor: null }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{feature.title}</h1>
      <AdminFeatureDetail
        appId={appId}
        feature={feature}
        initialComments={comments}
        initialFollowers={followersResult.followers}
        initialFollowersCursor={followersResult.nextCursor}
      />
    </div>
  );
}
