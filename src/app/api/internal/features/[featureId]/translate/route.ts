import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { translateFeatureSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import { translateFeature, NotFoundError } from "@/lib/features/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { featureId } = await params;
  const parsed = translateFeatureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { appId, targetLang } = parsed.data;
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists) return errorResponse("not_found", "App not found.");
  if (appSnap.data()!.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  try {
    const translation = await translateFeature({ appId, featureId, targetLang });
    return ok(translation);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse("not_found", "Feature not found.");
    }
    console.error("Failed to translate feature", error);
    return errorResponse(
      "internal",
      error instanceof Error ? error.message : "Failed to translate."
    );
  }
}
