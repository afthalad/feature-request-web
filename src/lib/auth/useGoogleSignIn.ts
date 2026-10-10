"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
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

export function useGoogleSignIn() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Each click gets an id, so a late result from an abandoned attempt can't touch a newer one.
  const attemptRef = useRef(0);
  const stageRef = useRef<"idle" | "popup" | "session">("idle");
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => () => cleanupRef.current(), []);

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

      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) throw new Error("Failed to create session");

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
