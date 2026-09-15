import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { listFeaturesForOwner } from "@/lib/features/service";
import { createFeatureAdmin } from "@/lib/admin/features";
import { logAdminAction } from "@/lib/admin/audit";
import { adminCreateFeatureSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId } = await params;
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("sort") === "top" ? "top" : "new";
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");

  const result = await listFeaturesForOwner({ appId, tab, limit, cursor });
  return ok(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId } = await params;
  const parsed = adminCreateFeatureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  let feature;
  try {
    feature = await createFeatureAdmin({ appId, adminUid: admin.uid, ...parsed.data });
  } catch {
    return errorResponse("not_found", "App not found.");
  }

  await logAdminAction({
    adminUid: admin.uid,
    action: "feature.create",
    targetType: "feature",
    targetId: `${appId}/${feature.id}`,
    after: parsed.data,
  });

  return ok({ feature }, 201);
}
