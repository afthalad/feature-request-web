import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { POLAR_API_BASE, grantsPaidAccess } from "@/lib/polar/client";
import { saveSubscriptionToUser, type PolarSubscription } from "@/lib/polar/saveSubscription";

// Reads the user's subscriptions from Polar and saves the current one, in case a webhook was missed.
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
  if (items.length === 0) return;

  await adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) return;

    const newestPaid = items
      .filter((item) => grantsPaidAccess(item.status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const tracked = items.find((item) => item.id === userSnap.get("subscriptionId"));
    const subscription = newestPaid ?? tracked;
    if (subscription) await saveSubscriptionToUser(tx, userRef, subscription);
  });
}
