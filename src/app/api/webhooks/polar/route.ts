import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type DocumentReference, type Transaction } from "firebase-admin/firestore";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { SDKValidationError } from "@polar-sh/sdk/models/errors/sdkvalidationerror.js";
import { adminDb } from "@/lib/firebase/admin";
import { grantsPaidAccess } from "@/lib/polar/client";
import { planFromProductId } from "@/lib/polar/products";

// The raw (snake_case) subscription object Polar sends with every subscription.* event.
interface PolarSubscription {
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

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.active",
  "subscription.updated",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.revoked",
  "subscription.past_due",
]);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const webhookId = req.headers.get("webhook-id");
  const webhookSignature = req.headers.get("webhook-signature");
  const webhookTimestamp = req.headers.get("webhook-timestamp");

  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  // validateEvent checks the signature first, then parses the body against the SDK's schemas.
  // A schema miss (an event type or field newer than this SDK) still means the signature was
  // good, so it isn't rejected — the handler reads the raw JSON below either way.
  try {
    validateEvent(
      raw,
      {
        "webhook-id": webhookId,
        "webhook-signature": webhookSignature,
        "webhook-timestamp": webhookTimestamp,
      },
      process.env.POLAR_WEBHOOK_SECRET ?? ""
    );
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.error("Polar webhook signature verification failed", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    if (!(error instanceof SDKValidationError)) throw error;
  }

  const event = JSON.parse(raw) as { type: string; data: unknown };
  if (!SUBSCRIPTION_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }
  const subscription = event.data as PolarSubscription;

  try {
    await adminDb.runTransaction(async (tx) => {
      const eventRef = adminDb.collection("polarWebhookEvents").doc(webhookId);
      const eventSnap = await tx.get(eventRef);
      if (eventSnap.exists) return;

      const userRef = await findUserRef(tx, subscription);
      if (userRef) await applySubscription(tx, userRef, subscription);

      tx.set(eventRef, {
        type: event.type,
        uid: userRef?.id ?? null,
        customerId: subscription.customer_id ?? null,
        subscriptionId: subscription.id,
        status: subscription.status,
        receivedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("Failed to process Polar webhook", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 503 });
  }

  return NextResponse.json({ received: true });
}

// Checkout sets the Polar customer's external_id (and the subscription's metadata) to the
// Firebase uid; the stored polarCustomerId is a fallback for customers made some other way.
async function findUserRef(
  tx: Transaction,
  subscription: PolarSubscription
): Promise<DocumentReference | null> {
  const uid = subscription.customer?.external_id ?? subscription.metadata?.app_user_id;
  if (typeof uid === "string" && uid) {
    const userRef = adminDb.collection("users").doc(uid);
    // Never recreate a deleted user's profile (deleting an account revokes its subscription,
    // and that revoke comes back here as a webhook).
    if ((await tx.get(userRef)).exists) return userRef;
  }

  const byCustomer = await tx.get(
    adminDb.collection("users").where("polarCustomerId", "==", subscription.customer_id).limit(1)
  );
  if (byCustomer.docs[0]) return byCustomer.docs[0].ref;

  console.error(`No user found for Polar customer ${subscription.customer_id}`);
  return null;
}

// Plan access follows the subscription's current status rather than the event type, so a
// replayed or reordered event can't leave the user on the wrong plan.
async function applySubscription(
  tx: Transaction,
  userRef: DocumentReference,
  subscription: PolarSubscription
) {
  const current = (await tx.get(userRef)).data() ?? {};
  const changedAt = subscription.modified_at ?? subscription.created_at;
  const isPaid = grantsPaidAccess(subscription.status);

  if (current.subscriptionId === subscription.id) {
    // Same subscription: ignore anything older than what's already stored.
    if (current.subscriptionChangedAt && changedAt < current.subscriptionChangedAt) return;
  } else if (grantsPaidAccess(current.subscriptionStatus) && !isPaid) {
    // A late event about some other, finished subscription mustn't cancel the live one.
    return;
  }

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
