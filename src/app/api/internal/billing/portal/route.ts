import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { dodo } from "@/lib/dodo/client";
import { ok, errorResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const userSnap = await adminDb.collection("users").doc(user.uid).get();
  const customerId: string | undefined = userSnap.data()?.dodoCustomerId;
  if (!customerId) {
    return errorResponse("not_found", "No billing account found yet.");
  }

  try {
    const session = await dodo.customers.customerPortal.create(customerId, {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
    return ok({ portalUrl: session.link });
  } catch (error) {
    console.error("Failed to create customer portal session", error);
    return errorResponse("internal", "Failed to open billing portal.");
  }
}
