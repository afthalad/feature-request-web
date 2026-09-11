import { notFound } from "next/navigation";
import { getFeature, listCommentsForAdmin } from "@/lib/admin/features";
import { AdminFeatureDetail } from "@/components/admin/AdminFeatureDetail";

export default async function AdminFeatureDetailPage({
  params,
}: {
  params: Promise<{ appId: string; featureId: string }>;
}) {
  const { appId, featureId } = await params;
  const feature = await getFeature(appId, featureId);
  if (!feature) notFound();

  const comments = await listCommentsForAdmin(appId, featureId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{feature.title}</h1>
      <AdminFeatureDetail appId={appId} feature={feature} initialComments={comments} />
    </div>
  );
}
