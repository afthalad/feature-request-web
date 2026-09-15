import { NextRequest } from "next/server";
import { getAdminFromAuthHeader } from "@/lib/auth/requireAdmin";
import {
  deleteUser,
  getUser,
  listAppsForUser,
  listWebhookEventsForUser,
  updateUserPlan,
} from "@/lib/admin/users";
import { logAdminAction } from "@/lib/admin/audit";
import { adminUpdateUserPlanSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { uid } = await params;
  const user = await getUser(uid);
  if (!user) return errorResponse("not_found", "User not found.");

  const apps = await listAppsForUser(uid);
  const webhookEvents = user.dodoCustomerId ? await listWebhookEventsForUser(user.dodoCustomerId) : [];

  return ok({ user, apps, webhookEvents });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { uid } = await params;
  const parsed = adminUpdateUserPlanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const before = await getUser(uid);
  if (!before) return errorResponse("not_found", "User not found.");

  await updateUserPlan(uid, parsed.data.plan, parsed.data.subscriptionStatus);

  await logAdminAction({
    adminUid: admin.uid,
    action: "user.plan_override",
    targetType: "user",
    targetId: uid,
    before: { plan: before.plan, subscriptionStatus: before.subscriptionStatus },
    after: parsed.data,
  });

  return ok({ uid, ...parsed.data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await getAdminFromAuthHeader(req);
  if (!admin) return errorResponse("forbidden", "Admin access required.");

  const { uid } = await params;
  const before = await getUser(uid);
  if (!before) return errorResponse("not_found", "User not found.");

  const { deletedAppIds } = await deleteUser(uid);

  await logAdminAction({
    adminUid: admin.uid,
    action: "user.delete",
    targetType: "user",
    targetId: uid,
    before: { email: before.email, plan: before.plan },
    after: { deletedAppIds },
  });

  return ok({ uid, deletedAppIds });
}
