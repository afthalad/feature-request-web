import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { updateAppSchema } from "@/lib/validation/schemas";
import { slugExists } from "@/lib/slug";
import { ok, errorResponse } from "@/lib/api/response";
import { softDeleteApp } from "@/lib/apps/lifecycle";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { appId } = await params;
  const parsed = updateAppSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const appRef = adminDb.collection("apps").doc(appId);
  const appSnap = await appRef.get();
  // A deleted app is gone for its owner (see src/lib/apps/lifecycle.ts).
  if (!appSnap.exists || appSnap.get("deleted") === true) {
    return errorResponse("not_found", "App not found.");
  }
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  if (parsed.data.slug && (await slugExists(parsed.data.slug, appId))) {
    return errorResponse("validation_failed", "That URL is already taken.");
  }

  await appRef.update(parsed.data);

  return ok({ id: appId, ...parsed.data });
}

// Owner-initiated delete. A soft delete: everything stops working at once and the app leaves
// the dashboard, but an admin can still restore it or purge it (src/lib/apps/lifecycle.ts).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { appId } = await params;
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists || appSnap.get("deleted") === true) {
    return errorResponse("not_found", "App not found.");
  }
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  await softDeleteApp(appId);
  return ok({ id: appId });
}
