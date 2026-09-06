import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { dodo } from "@/lib/dodo/client";
import { productIdFor } from "@/lib/dodo/products";
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

  try {
    const userRef = adminDb.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    let customerId: string | undefined = userSnap.data()?.dodoCustomerId;

    if (!customerId) {
      const customer = await dodo.customers.create({
        email: user.email ?? "",
        name: user.name ?? "",
        metadata: { app_user_id: user.uid },
      });
      customerId = customer.customer_id;
      await userRef.set({ dodoCustomerId: customerId }, { merge: true });
    }

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { customer_id: customerId },
      metadata: { app_user_id: user.uid },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    });

    if (!session.checkout_url) {
      return errorResponse("internal", "Checkout URL was not returned.");
    }

    return ok({ checkoutUrl: session.checkout_url });
  } catch (error) {
    console.error("Failed to create checkout session", error);
    return errorResponse("internal", "Failed to start checkout.");
  }
}
