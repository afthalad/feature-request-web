import { NextRequest } from "next/server";
import { resolveAppBySlug } from "@/lib/slug";
import { getDeviceId } from "@/lib/auth/verifyApiKey";
import { ok, errorResponse } from "@/lib/api/response";
import { voteOnFeature, NotFoundError } from "@/lib/features/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; featureId: string }> }
) {
  return handleVote(req, await params, "add");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; featureId: string }> }
) {
  return handleVote(req, await params, "remove");
}

async function handleVote(
  req: NextRequest,
  params: { slug: string; featureId: string },
  action: "add" | "remove"
) {
  const app = await resolveAppBySlug(params.slug);
  if (!app) return errorResponse("not_found", "Board not found.");

  const deviceId = getDeviceId(req);
  if (!deviceId) return errorResponse("missing_device_id", "X-Device-Id header is required.");

  try {
    const result = await voteOnFeature(app.id, params.featureId, deviceId, action);
    return ok(app.hideVoteCounts ? { ...result, upvoteCount: 0 } : result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse("not_found", "Feature not found.");
    }
    console.error("Failed to update vote", error);
    return errorResponse("internal", "Failed to update vote.");
  }
}
