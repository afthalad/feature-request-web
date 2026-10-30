import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { polar } from "@/lib/polar/client";
import { refreshSubscriptionFromPolar } from "@/lib/polar/refreshSubscription";
import { dodo } from "@/lib/dodo/client";
import { ok, errorResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  await refreshSubscriptionFromPolar(user.uid).catch((error) =>
    console.error(`Failed to refresh Polar subscription for ${user.uid}`, error)
  );

  const userData = (await adminDb.collection("users").doc(user.uid).get()).data();
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  try {
    if (userData?.polarCustomerId) {
      const session = await polar.customerSessions.create({
        externalCustomerId: user.uid,
        returnUrl,
      });
      return ok({ portalUrl: session.customerPortalUrl });
    }

    // Subscribers from before the move to Polar still manage billing in Dodo's portal.
    if (userData?.dodoCustomerId) {
      const session = await dodo.customers.customerPortal.create(userData.dodoCustomerId, {
        return_url: returnUrl,
      });
      return ok({ portalUrl: session.link });
    }
  } catch (error) {
    console.error("Failed to create customer portal session", error);
    return errorResponse("internal", "We couldn't open your billing page. Please try again.");
  }

  return errorResponse("not_found", "You don't have a paid plan yet.");
}
