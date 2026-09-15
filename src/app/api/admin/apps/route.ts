import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { createAppForOwner, listApps } from "@/lib/admin/apps";
import { logAdminAction } from "@/lib/admin/audit";
import { adminCreateAppSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import type { App } from "@/types";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const cursor = searchParams.get("cursor");
  const search = searchParams.get("search") ?? undefined;

  const result = await listApps({ limit, cursor, search });
  return ok(result);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const parsed = adminCreateAppSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  let result;
  try {
    result = await createAppForOwner({
      ...parsed.data,
      platforms: parsed.data.platforms as App["platforms"],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create app.";
    return errorResponse("validation_failed", message);
  }

  await logAdminAction({
    adminUid: admin.uid,
    action: "app.create",
    targetType: "app",
    targetId: result.app.id,
    after: { ownerUid: parsed.data.ownerUid, name: parsed.data.name },
  });

  return ok(result, 201);
}
