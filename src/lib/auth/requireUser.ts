import "server-only";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "session";

/** For server components/pages: resolves the signed-in user from the session cookie. */
export async function getSessionUser(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

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
