import { NextRequest } from "next/server";
import { verifyApiKey, getDeviceId } from "@/lib/auth/verifyApiKey";
import { followFeatureSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import { followFeature, unfollowFeature, NotFoundError } from "@/lib/followers/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const parsed = followFeatureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { featureId } = await params;
  try {
    await followFeature(keyInfo.appId, featureId, deviceId, parsed.data.email);
    return ok({ following: true });
  } catch (error) {
    if (error instanceof NotFoundError) return errorResponse("not_found", "Feature not found.");
    console.error("Failed to follow feature", error);
    return errorResponse("internal", "Failed to follow feature.");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const { featureId } = await params;
  try {
    await unfollowFeature(keyInfo.appId, featureId, deviceId);
    return ok({ following: false });
  } catch (error) {
    if (error instanceof NotFoundError) return errorResponse("not_found", "Feature not found.");
    console.error("Failed to unfollow feature", error);
    return errorResponse("internal", "Failed to unfollow feature.");
  }
}
