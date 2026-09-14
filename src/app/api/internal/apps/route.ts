import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { generateApiKey, hashApiKey, apiKeyDisplayPrefix } from "@/lib/auth/apiKey";
import { generateUniqueSlug } from "@/lib/slug";
import { createAppSchema } from "@/lib/validation/schemas";
import { ok, errorResponse } from "@/lib/api/response";
import { checkAppLimit } from "@/lib/plans/limits";

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const parsed = createAppSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const limitCheck = await checkAppLimit(user.uid);
  if (!limitCheck.allowed) {
    return errorResponse("limit_reached", limitCheck.message!);
  }

  const { name, bundleId, platforms } = parsed.data;
  const apiKey = generateApiKey();
  const appRef = adminDb.collection("apps").doc();
  const apiKeyRef = adminDb.collection("apiKeys").doc(hashApiKey(apiKey));
  const slug = await generateUniqueSlug(name);

  try {
    const batch = adminDb.batch();
    batch.set(appRef, {
      ownerUid: user.uid,
      name,
      bundleId,
      slug,
      apiKeyPrefix: apiKeyDisplayPrefix(apiKey),
      notificationEmail: user.email ?? "",
      emailOnNewRequest: true,
      platforms,
      featureCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    batch.set(apiKeyRef, {
      appId: appRef.id,
      ownerUid: user.uid,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    const appSnap = await appRef.get();
    const appData = appSnap.data();
    if (!appData) throw new Error("App not found after creation");

    return ok(
      {
        app: {
          id: appRef.id,
          ownerUid: appData.ownerUid,
          name: appData.name,
          bundleId: appData.bundleId,
          slug: appData.slug,
          apiKeyPrefix: appData.apiKeyPrefix,
          notificationEmail: appData.notificationEmail,
          emailOnNewRequest: appData.emailOnNewRequest,
          platforms: appData.platforms ?? [],
          featureCount: appData.featureCount,
          createdAt: appData.createdAt.toDate().toISOString(),
        },
        apiKey,
      },
      201
    );
  } catch (error) {
    console.error("Failed to create app", error);
    return errorResponse("internal", "Failed to create app.");
  }
}
