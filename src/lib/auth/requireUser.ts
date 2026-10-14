import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "session";

// Answers from the revocation check that really mean "signed out". Anything else (a network
// blip or a slow Firebase call) used to sign people out at random, so those fall back to
// checking the cookie locally instead.
const SIGNED_OUT_CODES = new Set([
  "auth/session-cookie-revoked",
  "auth/session-cookie-expired",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/argument-error",
]);

/**
 * For server components/pages: resolves the signed-in user from the session cookie. Cached per
 * request, so a layout and its page share one check.
 */
export const getSessionUser = cache(async (): Promise<DecodedIdToken | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    if (SIGNED_OUT_CODES.has(code)) return null;
    console.warn(`[auth] revocation check failed (${code || "unknown"}), checking the cookie locally`);
    try {
      // Signature and expiry only, against Google's cached public keys.
      return await adminAuth.verifySessionCookie(sessionCookie, false);
    } catch {
      return null;
    }
  }
});

/** For /api/internal routes: resolves the signed-in user from the Authorization header. */
export async function getUserFromAuthHeader(req: Request): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return null;

  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}
