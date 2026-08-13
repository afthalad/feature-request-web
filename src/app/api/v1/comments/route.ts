import { NextRequest } from "next/server";
import { verifyApiKey, getDeviceId } from "@/lib/auth/verifyApiKey";
import { createSdkCommentSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import { createComment, RateLimitError, NotFoundError } from "@/lib/comments/service";

export async function POST(req: NextRequest) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const parsed = createSdkCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    const comment = await createComment({
      appId: keyInfo.appId,
      featureId: parsed.data.featureId,
      deviceId,
      text: parsed.data.text,
      authorName: parsed.data.authorName,
      isDeveloper: false,
    });
    return ok(comment, 201);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return errorResponse("rate_limited", "Daily comment limit reached.");
    }
    if (error instanceof NotFoundError) {
      return errorResponse("not_found", "Feature not found.");
    }
    console.error("Failed to create comment", error);
    return errorResponse("internal", "Failed to create comment.");
  }
}
