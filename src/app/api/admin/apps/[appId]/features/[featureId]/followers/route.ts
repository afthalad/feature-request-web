import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { listFollowersForFeature } from "@/lib/followers/service";
import { addFollowerAdmin } from "@/lib/admin/followers";
import { logAdminAction } from "@/lib/admin/audit";
import { adminAddFollowerSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");

  const result = await listFollowersForFeature({ appId, featureId, limit, cursor });
  return ok(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId } = await params;
  const parsed = adminAddFollowerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  let follower;
  try {
    follower = await addFollowerAdmin(appId, featureId, parsed.data.email);
  } catch {
    return errorResponse("not_found", "Feature not found.");
  }

  await logAdminAction({
    adminUid: admin.uid,
    action: "follower.create",
    targetType: "follower",
    targetId: `${appId}/${featureId}/${follower.id}`,
    after: { email: parsed.data.email },
  });

  return ok({ follower }, 201);
}
