import type { Auth } from "firebase/auth";

/**
 * Firebase Auth, downloaded on first use. Marketing pages (home, pricing,
 * docs, compare) only need it to tell whether someone is signed in, so they
 * load it this way instead of putting it in the page bundle.
 */
let authPromise: Promise<Auth> | null = null;

export function loadAuth(): Promise<Auth> {
  authPromise ??= import("@/lib/firebase/client").then((m) => m.auth);
  return authPromise;
}
