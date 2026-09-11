import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { listUsers } from "@/lib/admin/users";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");
  const email = searchParams.get("email") ?? undefined;

  const result = await listUsers({ limit, cursor, email });
  return ok(result);
}
