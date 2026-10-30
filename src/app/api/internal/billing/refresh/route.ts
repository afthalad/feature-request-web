import { NextRequest } from "next/server";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { refreshSubscriptionFromPolar } from "@/lib/polar/refreshSubscription";
import { ok, errorResponse } from "@/lib/api/response";

// Refreshes the signed-in user's plan while the dashboard waits after checkout.
export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  try {
    await refreshSubscriptionFromPolar(user.uid);
    return ok({ refreshed: true });
  } catch (error) {
    console.error(`Failed to refresh Polar subscription for ${user.uid}`, error);
    return errorResponse("internal", "We couldn't check your plan right now.");
  }
}
