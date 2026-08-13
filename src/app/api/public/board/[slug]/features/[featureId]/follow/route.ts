import { NextRequest } from "next/server";
import { resolveAppBySlug } from "@/lib/slug";
import { getDeviceId } from "@/lib/auth/verifyApiKey";
import { followFeatureSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import { followFeature, unfollowFeature, NotFoundError } from "@/lib/followers/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; featureId: string }> }
) {
  const { slug, featureId } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) return errorResponse("not_found", "Board not found.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const parsed = followFeatureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    await followFeature(app.id, featureId, deviceId, parsed.data.email);
    return ok({ following: true });
  } catch (error) {
    if (error instanceof NotFoundError) return errorResponse("not_found", "Feature not found.");
    console.error("Failed to follow feature", error);
    return errorResponse("internal", "Failed to follow feature.");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; featureId: string }> }
) {
  const { slug, featureId } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) return errorResponse("not_found", "Board not found.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  try {
    await unfollowFeature(app.id, featureId, deviceId);
    return ok({ following: false });
  } catch (error) {
    if (error instanceof NotFoundError) return errorResponse("not_found", "Feature not found.");
    console.error("Failed to unfollow feature", error);
    return errorResponse("internal", "Failed to unfollow feature.");
  }
}
