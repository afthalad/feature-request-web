import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { listCommentsForAdmin } from "@/lib/admin/features";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; featureId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId, featureId } = await params;
  const comments = await listCommentsForAdmin(appId, featureId);
  return ok({ comments });
}
