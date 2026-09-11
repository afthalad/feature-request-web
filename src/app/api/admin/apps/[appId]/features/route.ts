import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { listFeaturesForOwner } from "@/lib/features/service";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId } = await params;
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("sort") === "top" ? "top" : "new";
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");

  const result = await listFeaturesForOwner({ appId, tab, limit, cursor });
  return ok(result);
}
