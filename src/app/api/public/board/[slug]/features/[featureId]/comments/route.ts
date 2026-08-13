import { NextRequest } from "next/server";
import { resolveAppBySlug } from "@/lib/slug";
import { getDeviceId } from "@/lib/auth/verifyApiKey";
import { createCommentSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import {
  listCommentsForFeature,
  createComment,
  RateLimitError,
  NotFoundError,
} from "@/lib/comments/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; featureId: string }> }
) {
  const { slug, featureId } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) return errorResponse("not_found", "Board not found.");

  const comments = await listCommentsForFeature(app.id, featureId);
  return ok({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; featureId: string }> }
) {
  const { slug, featureId } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) return errorResponse("not_found", "Board not found.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const parsed = createCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    const comment = await createComment({
      appId: app.id,
      featureId,
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
