import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getSessionUser, getUserFromAuthHeader } from "@/lib/auth/requireUser";

function getAdminUids(): Set<string> {
  return new Set(
    (process.env.ADMIN_UIDS ?? "")
      .split(",")
      .map((uid) => uid.trim())
      .filter(Boolean)
  );
}

export function isAdminUid(uid: string): boolean {
  return getAdminUids().has(uid);
}

/** For admin pages: resolves the signed-in user only if they're on the admin allowlist. */
export async function getAdminSessionUser(): Promise<DecodedIdToken | null> {
  const user = await getSessionUser();
  if (!user || !isAdminUid(user.uid)) return null;
  return user;
}

/** For /api/admin routes: resolves the signed-in user only if they're on the admin allowlist. */
export async function getAdminFromAuthHeader(req: Request): Promise<DecodedIdToken | null> {
  const user = await getUserFromAuthHeader(req);
  if (!user || !isAdminUid(user.uid)) return null;
  return user;
}
