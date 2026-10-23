"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The server session lasts a fixed 14 days from when it was made, so swap in a fresh one once
 * it's this old. Anyone who opens the dashboard at least once in 14 days then never hits expiry.
 */
const SESSION_RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

interface AuthGuardProps {
  children: React.ReactNode;
  /** When the current session cookie was made (ms), or null without one. */
  sessionIssuedAt: number | null;
}

export function AuthGuard({ children, sessionIssuedAt }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const issuedAtRef = useRef(sessionIssuedAt);
  const isRenewingRef = useRef(false);

  useEffect(() => {
    let currentUser: User | null = null;

    async function renewIfDue() {
      const issuedAt = issuedAtRef.current;
      if (!currentUser || issuedAt === null || isRenewingRef.current) return;
      if (Date.now() - issuedAt < SESSION_RENEW_AFTER_MS) return;

      isRenewingRef.current = true;
      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (response.ok) issuedAtRef.current = Date.now();
      } catch {
        // Keep the current session; the next focus tries again.
      } finally {
        isRenewingRef.current = false;
      }
    }

    // A tab can stay open for days without reloading this layout, so check again on return.
    function onReturn() {
      if (document.visibilityState === "visible") renewIfDue();
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (user) {
        setIsAuthed(true);
        renewIfDue();
      } else {
        router.replace("/login");
      }
    });
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [router]);

  if (!isAuthed) {
    return (
      <div className="mx-auto w-full max-w-[1100px] flex-1 space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
