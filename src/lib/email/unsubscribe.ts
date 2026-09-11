import "server-only";
import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

function normalize(email: string): string {
  return email.toLowerCase().trim();
}

export function emailHash(email: string): string {
  return createHash("sha256").update(normalize(email)).digest("hex");
}

export function encodeUnsubscribeToken(email: string): string {
  return Buffer.from(normalize(email)).toString("base64url");
}

export function decodeUnsubscribeToken(token: string): string | null {
  try {
    const email = Buffer.from(token, "base64url").toString("utf8");
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

export function unsubscribeUrl(email: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return `${appUrl}/unsubscribe?token=${encodeUnsubscribeToken(email)}`;
}

export async function isUnsubscribed(email: string): Promise<boolean> {
  const doc = await adminDb.collection("unsubscribes").doc(emailHash(email)).get();
  return doc.exists;
}

export async function filterUnsubscribed(emails: string[]): Promise<string[]> {
  if (emails.length === 0) return [];
  const refs = emails.map((email) => adminDb.collection("unsubscribes").doc(emailHash(email)));
  const snaps = await adminDb.getAll(...refs);
  return emails.filter((_, i) => !snaps[i].exists);
}

export async function addUnsubscribe(email: string): Promise<void> {
  await adminDb
    .collection("unsubscribes")
    .doc(emailHash(email))
    .set({ createdAt: FieldValue.serverTimestamp() });
}

export async function removeUnsubscribe(email: string): Promise<boolean> {
  const ref = adminDb.collection("unsubscribes").doc(emailHash(email));
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export async function lookupUnsubscribe(
  email: string
): Promise<{ email: string; createdAt: string } | null> {
  const snap = await adminDb.collection("unsubscribes").doc(emailHash(email)).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return { email: normalize(email), createdAt: data.createdAt.toDate().toISOString() };
}
