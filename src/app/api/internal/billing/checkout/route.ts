import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { polar, grantsPaidAccess } from "@/lib/polar/client";
import { productIdFor } from "@/lib/polar/products";
import { refreshSubscriptionFromPolar } from "@/lib/polar/refreshSubscription";
import { ok, errorResponse } from "@/lib/api/response";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro"]),
  period: z.enum(["monthly", "yearly"]),
});

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { plan, period } = parsed.data;
  const productId = productIdFor(plan, period);
  if (!productId) {
    return errorResponse("internal", "This plan isn't available right now. Please try again later.");
  }

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success&plan=${plan}`;

  try {
    // Avoids a second subscription when a webhook was missed.
    await refreshSubscriptionFromPolar(user.uid).catch((error) =>
      console.error(`Failed to refresh Polar subscription for ${user.uid}`, error)
    );

    const userData = (await adminDb.collection("users").doc(user.uid).get()).data();
    const hasPaidSubscription = grantsPaidAccess(userData?.subscriptionStatus);

    // Older subscribers stay on their existing plan until it ends.
    const isPaidPlan = userData?.plan === "starter" || userData?.plan === "pro";
    if (isPaidPlan && !userData?.polarCustomerId && userData?.dodoCustomerId) {
      return errorResponse(
        "validation_failed",
        "You already have a paid plan. You can change or cancel it from Manage billing, and switch plans here once it ends."
      );
    }

    // Switches the existing subscription instead of starting a second one.
    if (hasPaidSubscription && userData?.polarCustomerId && userData?.subscriptionId) {
      if (userData.currentProductId === productId) {
        return errorResponse("validation_failed", "You're already on this plan.");
      }
      await polar.subscriptions.update({
        id: userData.subscriptionId,
        subscriptionUpdate: { productId, prorationBehavior: "invoice" },
      });
      return ok({ checkoutUrl: successUrl });
    }

    const checkout = await polar.checkouts.create({
      products: [productId],
      externalCustomerId: user.uid,
      customerEmail: user.email || undefined,
      customerName: user.name || undefined,
      metadata: { app_user_id: user.uid },
      successUrl,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return ok({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Failed to start Polar checkout", error);
    return errorResponse("internal", "We couldn't start checkout. Please try again.");
  }
}
