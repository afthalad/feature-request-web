import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { dodo } from "@/lib/dodo/client";
import { planFromProductId } from "@/lib/dodo/products";

interface SubscriptionEventData {
  subscription_id: string;
  product_id: string;
  status: string;
  customer: { customer_id: string };
  cancel_at_next_billing_date?: boolean;
  next_billing_date?: string;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const webhookId = req.headers.get("webhook-id");
  const webhookSignature = req.headers.get("webhook-signature");
  const webhookTimestamp = req.headers.get("webhook-timestamp");

  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  let event;
  try {
    event = dodo.webhooks.unwrap(raw, {
      headers: {
        "webhook-id": webhookId,
        "webhook-signature": webhookSignature,
        "webhook-timestamp": webhookTimestamp,
      },
    });
  } catch (error) {
    console.error("Dodo webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    await adminDb.runTransaction(async (tx) => {
      const eventRef = adminDb.collection("dodoWebhookEvents").doc(webhookId);
      const eventSnap = await tx.get(eventRef);
      if (eventSnap.exists) return;

      await applySubscriptionEvent(tx, event.type, event.data as unknown as SubscriptionEventData);

      tx.set(eventRef, { type: event.type, receivedAt: FieldValue.serverTimestamp() });
    });
  } catch (error) {
    console.error("Failed to process Dodo webhook", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 503 });
  }

  return NextResponse.json({ received: true });
}

async function applySubscriptionEvent(tx: Transaction, type: string, data: SubscriptionEventData) {
  const SUBSCRIPTION_EVENTS = new Set([
    "subscription.active",
    "subscription.renewed",
    "subscription.on_hold",
    "subscription.plan_changed",
    "subscription.cancelled",
    "subscription.expired",
    "subscription.failed",
  ]);
  if (!SUBSCRIPTION_EVENTS.has(type)) return;

  const customerId = data.customer?.customer_id;
  if (!customerId) return;

  const userQuery = await tx.get(
    adminDb.collection("users").where("dodoCustomerId", "==", customerId).limit(1)
  );
  const userDoc = userQuery.docs[0];
  if (!userDoc) {
    console.error(`No user found for Dodo customer ${customerId}`);
    return;
  }

  const base = {
    subscriptionId: data.subscription_id,
    subscriptionStatus: data.status,
    nextBillingDate: data.next_billing_date ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  switch (type) {
    case "subscription.active":
    case "subscription.plan_changed": {
      const mapped = planFromProductId(data.product_id);
      tx.set(
        userDoc.ref,
        {
          ...base,
          plan: mapped?.plan ?? "free",
          billingPeriod: mapped?.period ?? null,
          currentProductId: data.product_id,
        },
        { merge: true }
      );
      break;
    }
    case "subscription.renewed":
    case "subscription.on_hold":
      tx.set(userDoc.ref, base, { merge: true });
      break;
    case "subscription.cancelled":
      if (data.cancel_at_next_billing_date) {
        tx.set(userDoc.ref, base, { merge: true });
      } else {
        tx.set(userDoc.ref, { ...base, plan: "free" }, { merge: true });
      }
      break;
    case "subscription.expired":
      tx.set(userDoc.ref, { ...base, plan: "free" }, { merge: true });
      break;
    case "subscription.failed":
      tx.set(userDoc.ref, base, { merge: true });
      break;
  }
}
