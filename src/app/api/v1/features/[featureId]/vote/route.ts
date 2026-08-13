import { NextRequest } from "next/server";
import { verifyApiKey, getDeviceId } from "@/lib/auth/verifyApiKey";
import { ok, errorResponse } from "@/lib/api/response";
import { voteOnFeature, NotFoundError } from "@/lib/features/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  return handleVote(req, await params, "add");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  return handleVote(req, await params, "remove");
}

async function handleVote(
  req: NextRequest,
  params: { featureId: string },
  action: "add" | "remove"
) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  try {
    const result = await voteOnFeature(keyInfo.appId, params.featureId, deviceId, action);
    return ok(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse("not_found", "Feature not found.");
    }
    console.error("Failed to update vote", error);
    return errorResponse("internal", "Failed to update vote.");
  }
}
