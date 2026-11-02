import { NextRequest } from "next/server";
import { requireApiKey, getDeviceId } from "@/lib/auth/verifyApiKey";
import { ok } from "@/lib/api/response";
import { listCommentsForFeature } from "@/lib/comments/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const keyInfo = await requireApiKey(req);
  if (keyInfo instanceof Response) return keyInfo;

  const { featureId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");

  const result = await listCommentsForFeature({
    appId: keyInfo.appId,
    featureId,
    limit,
    cursor,
    deviceId: getDeviceId(req),
  });
  return ok(result);
}
