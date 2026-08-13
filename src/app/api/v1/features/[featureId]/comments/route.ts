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
  const comments = await listCommentsForFeature(keyInfo.appId, featureId);
  return ok({ comments });
}
