import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { deleteFeature, getFeature, updateFeature } from "@/lib/admin/features";
import { logAdminAction } from "@/lib/admin/audit";
import { adminUpdateFeatureSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId } = await params;
  const feature = await getFeature(appId, featureId);
  if (!feature) return errorResponse("not_found", "Feature not found.");

  return ok({ feature });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId } = await params;
  const parsed = adminUpdateFeatureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const before = await getFeature(appId, featureId);
  if (!before) return errorResponse("not_found", "Feature not found.");

  await updateFeature(appId, featureId, parsed.data);

  await logAdminAction({
    adminUid: admin.uid,
    action: "feature.update",
    targetType: "feature",
    targetId: `${appId}/${featureId}`,
    before,
    after: parsed.data,
  });

  const after = await getFeature(appId, featureId);
  return ok({ feature: after });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId } = await params;
  const before = await getFeature(appId, featureId);
  if (!before) return errorResponse("not_found", "Feature not found.");

  await deleteFeature(appId, featureId);

  await logAdminAction({
    adminUid: admin.uid,
    action: "feature.delete",
    targetType: "feature",
    targetId: `${appId}/${featureId}`,
    before,
  });

  return ok({ id: featureId });
}
