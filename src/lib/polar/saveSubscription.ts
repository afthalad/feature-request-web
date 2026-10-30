import "server-only";
import { FieldValue, type DocumentReference, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { grantsPaidAccess } from "@/lib/polar/client";
import { planFromProductId } from "@/lib/polar/products";

// A subscription as Polar sends it in webhooks and API responses.
export interface PolarSubscription {
  id: string;
  status: string;
  product_id: string;
  customer_id: string;
  customer?: { id: string; external_id?: string | null };
  metadata?: Record<string, unknown>;
  cancel_at_period_end?: boolean;
  current_period_end?: string | null;
  created_at: string;
  modified_at?: string | null;
}

// Finds the user a subscription belongs to. Skips deleted users so they aren't recreated.
export async function findSubscriptionOwner(
  tx: Transaction,
  subscription: PolarSubscription
): Promise<DocumentReference | null> {
  const uid = subscription.customer?.external_id ?? subscription.metadata?.app_user_id;
  if (typeof uid === "string" && uid) {
    const userRef = adminDb.collection("users").doc(uid);
    if ((await tx.get(userRef)).exists) return userRef;
  }

  const byCustomer = await tx.get(
    adminDb.collection("users").where("polarCustomerId", "==", subscription.customer_id).limit(1)
  );
  if (byCustomer.docs[0]) return byCustomer.docs[0].ref;

  console.error(`No user found for Polar customer ${subscription.customer_id}`);
  return null;
}

// Saves a subscription's plan and status to the user, ignoring stale or unrelated updates.
export async function saveSubscriptionToUser(
  tx: Transaction,
  userRef: DocumentReference,
  subscription: PolarSubscription
) {
  const current = (await tx.get(userRef)).data() ?? {};
  const changedAt = subscription.modified_at ?? subscription.created_at;
  const isPaid = grantsPaidAccess(subscription.status);

  const isOlderUpdate =
    current.subscriptionId === subscription.id &&
    current.subscriptionChangedAt &&
    changedAt < current.subscriptionChangedAt;
  const wouldEndAnotherActivePlan =
    current.subscriptionId !== subscription.id &&
    grantsPaidAccess(current.subscriptionStatus) &&
    !isPaid;
  if (isOlderUpdate || wouldEndAnotherActivePlan) return;

  const mapped = planFromProductId(subscription.product_id);
  if (isPaid && !mapped) {
    console.error(`Polar product ${subscription.product_id} isn't mapped to a plan`);
  }

  tx.set(
    userRef,
    {
      polarCustomerId: subscription.customer_id,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionChangedAt: changedAt,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      nextBillingDate: subscription.current_period_end ?? null,
      currentProductId: subscription.product_id,
      plan: isPaid && mapped ? mapped.plan : "free",
      billingPeriod: mapped?.period ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
