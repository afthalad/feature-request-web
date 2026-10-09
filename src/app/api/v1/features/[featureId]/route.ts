import { NextRequest } from "next/server";
import { verifyApiKey, getDeviceId } from "@/lib/auth/verifyApiKey";
import { ok, errorResponse } from "@/lib/api/response";
import { getFeatureForApp, NotFoundError } from "@/lib/features/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const { featureId } = await params;

  try {
    const feature = await getFeatureForApp({ appId: keyInfo.appId, featureId, deviceId });
    return ok(feature);
  } catch (error) {
    if (error instanceof NotFoundError) return errorResponse("not_found", "Feature not found.");
    console.error("Failed to load feature", error);
    return errorResponse("internal", "Failed to load feature.");
  }
}
