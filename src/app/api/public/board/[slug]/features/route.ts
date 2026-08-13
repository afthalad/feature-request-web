import { NextRequest } from "next/server";
import { resolveAppBySlug } from "@/lib/slug";
import { getDeviceId } from "@/lib/auth/verifyApiKey";
import { createFeatureSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import {
  listFeaturesForApp,
  createFeatureForApp,
  RateLimitError,
  LimitExceededError,
} from "@/lib/features/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) return errorResponse("not_found", "Board not found.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "top" ? "top" : "new";
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");

  const result = await listFeaturesForApp({ appId: app.id, deviceId, sort, limit, cursor });
  return ok(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) return errorResponse("not_found", "Board not found.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const parsed = createFeatureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    const feature = await createFeatureForApp({
      appId: app.id,
      deviceId,
      title: parsed.data.title,
      description: parsed.data.description,
      email: parsed.data.email,
    });
    return ok(feature, 201);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return errorResponse("rate_limited", "Daily submission limit reached.");
    }
    if (error instanceof LimitExceededError) {
      return errorResponse("limit_reached", error.message);
    }
    console.error("Failed to create feature", error);
    return errorResponse("internal", "Failed to create feature.");
  }
}
