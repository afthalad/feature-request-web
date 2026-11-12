import "server-only";
import { cache } from "react";
import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Plan } from "@/types";

/**
 * Reads the dashboard layout (sidebar) and its pages both need. Cached per request, so a layout
 * and the page under it share one Firestore read instead of each fetching the same documents.
 */
export const getOwnedAppsSnapshot = cache((uid: string) =>
  adminDb.collection("apps").where("ownerUid", "==", uid).get(),
);

export const getUserSnapshot = cache((uid: string) =>
  adminDb.collection("users").doc(uid).get(),
);

/** The plan stored on a user document; anything unrecognised counts as free. */
export function planFromUserData(data: DocumentData | undefined): Plan {
  const plan = data?.plan;
  return plan === "pro" || plan === "starter" ? plan : "free";
}
