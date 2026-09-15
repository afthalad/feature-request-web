import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import { deleteApp, getApp, setAppDisabled, updateApp } from "@/lib/admin/apps";
import { logAdminAction } from "@/lib/admin/audit";
import { adminUpdateAppSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId } = await params;
  const app = await getApp(appId);
  if (!app) return errorResponse("not_found", "App not found.");

  return ok({ app });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId } = await params;
  const parsed = adminUpdateAppSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const before = await getApp(appId);
  if (!before) return errorResponse("not_found", "App not found.");

  const { disabled, ...fields } = parsed.data;
  if (Object.keys(fields).length > 0) await updateApp(appId, fields);
  if (disabled !== undefined && disabled !== before.disabled) await setAppDisabled(appId, disabled);

  await logAdminAction({
    adminUid: admin.uid,
    action: "app.update",
    targetType: "app",
    targetId: appId,
    before,
    after: parsed.data,
  });

  const after = await getApp(appId);
  return ok({ app: after });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { appId } = await params;
  const before = await getApp(appId);
  if (!before) return errorResponse("not_found", "App not found.");

  await deleteApp(appId);

  await logAdminAction({
    adminUid: admin.uid,
    action: "app.delete",
    targetType: "app",
    targetId: appId,
    before,
  });

  return ok({ id: appId });
}
