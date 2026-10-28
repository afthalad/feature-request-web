import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { polar, grantsPaidAccess } from "@/lib/polar/client";
import { productIdFor } from "@/lib/polar/products";
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
    return errorResponse("internal", "That plan isn't available for checkout yet.");
  }

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success&plan=${plan}`;

  try {
    const userData = (await adminDb.collection("users").doc(user.uid).get()).data();
    const hasPaidSubscription = grantsPaidAccess(userData?.subscriptionStatus);

    // Subscribers from before the move to Polar are still billed by Dodo. A Polar checkout would
    // charge them twice, so they stay on Dodo until that plan ends (Manage billing still opens
    // Dodo's portal).
    const isPaidPlan = userData?.plan === "starter" || userData?.plan === "pro";
    if (isPaidPlan && !userData?.polarCustomerId && userData?.dodoCustomerId) {
      return errorResponse(
        "validation_failed",
        "Your current plan is billed through our previous provider. Manage or cancel it from Manage billing — you can switch here once it ends."
      );
    }

    // An existing Polar subscriber switches plan on the same subscription instead of starting a
    // second one; Polar invoices the prorated difference straight away.
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

    // externalCustomerId ties the Polar customer to the Firebase uid, so webhooks map straight
    // back to users/{uid} without storing a customer ID first.
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
    return errorResponse("internal", "Failed to start checkout.");
  }
}
