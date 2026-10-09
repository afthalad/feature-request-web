import { NextRequest } from "next/server";
import { verifyApiKey, getDeviceId } from "@/lib/auth/verifyApiKey";
import { createFeatureSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import {
  listFeaturesForApp,
  createFeatureForApp,
  RateLimitError,
  LimitExceededError,
} from "@/lib/features/service";
import { FEATURE_STATUSES, type FeatureStatus } from "@/types";

// `?status=planned,in_progress,done` — unknown names are dropped rather than rejected, so a
// newer SDK asking for a status this deploy does not have still gets a sensible list.
function parseStatuses(value: string | null): FeatureStatus[] | undefined {
  if (!value) return undefined;
  const statuses = value
    .split(",")
    .map((status) => status.trim())
    .filter((status): status is FeatureStatus =>
      FEATURE_STATUSES.includes(status as FeatureStatus),
    );
  return statuses.length > 0 ? statuses.slice(0, FEATURE_STATUSES.length) : undefined;
}

export async function GET(req: NextRequest) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "top" ? "top" : "new";
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");
  const statuses = parseStatuses(searchParams.get("status"));

  const result = await listFeaturesForApp({
    appId: keyInfo.appId,
    deviceId,
    sort,
    limit,
    cursor,
    statuses,
  });
  return ok(result);
}

export async function POST(req: NextRequest) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  const parsed = createFeatureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    const feature = await createFeatureForApp({
      appId: keyInfo.appId,
      deviceId,
      title: parsed.data.title,
      description: parsed.data.description,
      email: parsed.data.email,
      isSubscriber: parsed.data.isSubscriber,
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
