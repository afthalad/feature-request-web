"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { toast } from "sonner";
import { auth, googleAuthProvider } from "@/lib/firebase/client";

/** Errors that just mean the user backed out — no toast for these. */
const CANCEL_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

/**
 * Firebase only notices a closed popup by polling, and then waits a few more seconds before
 * rejecting, so the button can sit on "Signing in…" long after the user cancelled. When focus
 * comes back to this page and no credential has arrived shortly after, treat it as cancelled.
 */
const FOCUS_CANCEL_GRACE_MS = 1200;

/**
 * The server session lasts 14 days, but Firebase keeps the browser signed in for much longer,
 * so people land here while still signed in. Renew the session for them, at most once per this
 * window, so a server that keeps refusing it can't bounce them back and forth.
 */
const RESUME_GUARD_MS = 30_000;
const RESUME_KEY = "fewchurs.sessionResumedAt";

async function createSession(user: User) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) throw new Error("Failed to create session");
}

function recentlyResumed(): boolean {
  try {
    return Date.now() - Number(sessionStorage.getItem(RESUME_KEY) ?? 0) < RESUME_GUARD_MS;
  } catch {
    return false;
  }
}

function markResumed() {
  try {
    sessionStorage.setItem(RESUME_KEY, String(Date.now()));
  } catch {
    // Private mode: the guard just doesn't persist.
  }
}

export function useGoogleSignIn() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Each click gets an id, so a late result from an abandoned attempt can't touch a newer one.
  const attemptRef = useRef(0);
  const stageRef = useRef<"idle" | "popup" | "session">("idle");
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => () => cleanupRef.current(), []);

  // Already signed in to Firebase: renew the session and go straight back to the dashboard.
  useEffect(() => {
    let done = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || done || stageRef.current !== "idle" || recentlyResumed()) return;
      done = true;
      markResumed();
      setIsSigningIn(true);
      try {
        await createSession(user);
        router.replace("/dashboard");
      } catch {
        setIsSigningIn(false);
      }
    });
    return unsubscribe;
  }, [router]);

  function reset(attempt: number) {
    if (attempt !== attemptRef.current) return;
    cleanupRef.current();
    stageRef.current = "idle";
    setIsSigningIn(false);
  }

  function watchForCancel(attempt: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReturn = () => {
      if (document.visibilityState === "hidden") return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (attempt === attemptRef.current && stageRef.current === "popup") reset(attempt);
      }, FOCUS_CANCEL_GRACE_MS);
    };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    cleanupRef.current = () => {
      clearTimeout(timer);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }

  async function signIn() {
    cleanupRef.current();
    const attempt = ++attemptRef.current;
    stageRef.current = "popup";
    setIsSigningIn(true);
    watchForCancel(attempt);

    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      if (attempt !== attemptRef.current) return;
      stageRef.current = "session";
      cleanupRef.current();
      // The focus watcher may have reset the button while the popup was finishing up.
      setIsSigningIn(true);

      await createSession(credential.user);

      router.push("/dashboard");
    } catch (error) {
      if (attempt !== attemptRef.current) return;
      reset(attempt);
      if (error instanceof FirebaseError && CANCEL_CODES.has(error.code)) return;
      if (error instanceof FirebaseError && error.code === "auth/popup-blocked") {
        toast.error("Your browser blocked the sign-in popup. Allow popups for this site and try again.");
        return;
      }
      console.error(error);
      toast.error("Sign in failed. Please try again.");
    }
  }

  return { signIn, isSigningIn };
}
