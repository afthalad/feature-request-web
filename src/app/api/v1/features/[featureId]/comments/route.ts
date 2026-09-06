import { NextRequest } from "next/server";
import { verifyApiKey } from "@/lib/auth/verifyApiKey";
import { ok, errorResponse } from "@/lib/api/response";
import { listCommentsForFeature } from "@/lib/comments/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const keyInfo = await verifyApiKey(req);
  if (!keyInfo) return errorResponse("invalid_key", "Invalid or inactive API key.");

  const { featureId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");

  const result = await listCommentsForFeature({ appId: keyInfo.appId, featureId, limit, cursor });
  return ok(result);
}
