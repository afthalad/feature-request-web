import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { updateAppSchema } from "@/lib/validation/schemas";
import { slugExists } from "@/lib/slug";
import { ok, errorResponse } from "@/lib/api/response";

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
  if (!appSnap.exists) return errorResponse("not_found", "App not found.");
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  if (parsed.data.slug && (await slugExists(parsed.data.slug, appId))) {
    return errorResponse("validation_failed", "That URL is already taken.");
  }

  await appRef.update(parsed.data);

  return ok({ id: appId, ...parsed.data });
}
