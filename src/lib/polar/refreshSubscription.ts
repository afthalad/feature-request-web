import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { POLAR_API_BASE, grantsPaidAccess } from "@/lib/polar/client";
import { saveSubscriptionToUser, type PolarSubscription } from "@/lib/polar/saveSubscription";

// Reads the user's subscriptions from Polar and saves the current one, in case a webhook was missed.
// A saved subscription Polar doesn't list at all came from the other Polar environment (sandbox
// test purchases made while the live site ran on POLAR_SERVER=sandbox), so its billing is cleared.
export async function refreshSubscriptionFromPolar(uid: string): Promise<void> {
  const url = new URL("/v1/subscriptions/", POLAR_API_BASE);
  url.searchParams.set("external_customer_id", uid);
  url.searchParams.set("limit", "100");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Polar subscription list failed: ${response.status} ${await response.text()}`);
  }
  const { items } = (await response.json()) as { items: PolarSubscription[] };

  await adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) return;

    const newestPaid = items
      .filter((item) => grantsPaidAccess(item.status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const trackedId = userSnap.get("subscriptionId") as string | undefined;
    const tracked = items.find((item) => item.id === trackedId);
    const subscription = newestPaid ?? tracked;
    if (subscription) {
      await saveSubscriptionToUser(tx, userRef, subscription);
      return;
    }

    if (trackedId && userSnap.get("polarCustomerId")) {
      console.warn(`[billing] clearing subscription ${trackedId} for ${uid}: not found in this Polar environment`);
      tx.set(
        userRef,
        {
          polarCustomerId: FieldValue.delete(),
          subscriptionId: FieldValue.delete(),
          subscriptionStatus: FieldValue.delete(),
          subscriptionChangedAt: FieldValue.delete(),
          currentProductId: FieldValue.delete(),
          cancelAtPeriodEnd: false,
          nextBillingDate: null,
          billingPeriod: null,
          plan: "free",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  });
}
