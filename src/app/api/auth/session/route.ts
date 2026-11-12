import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/requireUser";
import { trackServer } from "@/lib/analytics/server";

const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "missing idToken" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "invalid idToken" }, { status: 401 });
  }

  const profile = {
    email: decoded.email ?? "",
    displayName: decoded.name ?? "",
    photoURL: decoded.picture ?? "",
  };
  const isNewUser = await upsertUserProfile(decoded.uid, profile);
  if (isNewUser) {
    trackServer(decoded.uid, "signed_up", {
      method: decoded.firebase?.sign_in_provider ?? "unknown",
      $set: { email: profile.email, name: profile.displayName, plan: "free" },
      $set_once: { signed_up_at: new Date().toISOString() },
    });
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_IN_MS,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRES_IN_MS / 1000,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

async function upsertUserProfile(
  uid: string,
  profile: { email: string; displayName: string; photoURL: string }
): Promise<boolean> {
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    await userRef.set({ ...profile, plan: "free", createdAt: FieldValue.serverTimestamp() });
    return true;
  }
  await userRef.set(profile, { merge: true });
  return false;
}
