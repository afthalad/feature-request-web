import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Webhook } from "standardwebhooks";
import { adminDb } from "@/lib/firebase/admin";
import {
  findSubscriptionOwner,
  saveSubscriptionToUser,
  type PolarSubscription,
} from "@/lib/polar/saveSubscription";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.active",
  "subscription.updated",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.revoked",
  "subscription.past_due",
  "subscription.cycled",
  "subscription.paused",
  "subscription.resumed",
  "subscription.migrated",
]);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const webhookId = req.headers.get("webhook-id");
  const webhookSignature = req.headers.get("webhook-signature");
  const webhookTimestamp = req.headers.get("webhook-timestamp");

  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  const signed = verifySignature(raw, {
    "webhook-id": webhookId,
    "webhook-signature": webhookSignature,
    "webhook-timestamp": webhookTimestamp,
  });
  if (!signed) {
    console.error("Polar webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
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

      const userRef = await findSubscriptionOwner(tx, subscription);
      if (userRef) await saveSubscriptionToUser(tx, userRef, subscription);

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

// Accepts both Polar secret formats: "whsec_<base64>" and the older raw string.
function verifySignature(raw: string, headers: Record<string, string>): boolean {
  const secret = process.env.POLAR_WEBHOOK_SECRET ?? "";
  if (!secret) return false;

  const legacyKey = Buffer.from(secret, "utf-8").toString("base64");
  const keys = secret.startsWith("whsec_") ? [secret, legacyKey] : [legacyKey];
  return keys.some((key) => {
    try {
      new Webhook(key).verify(raw, headers);
      return true;
    } catch {
      return false;
    }
  });
}
