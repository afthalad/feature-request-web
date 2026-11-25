"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/marketing/GoogleIcon";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";
import { isInAppBrowser } from "@/lib/device/inAppBrowser";

/** The only interactive part of the login page, so the rest stays server-rendered. */
export function GoogleSignInButton() {
  const { signIn, isSigningIn } = useGoogleSignIn({ resumeSession: true });
  const [inAppBrowser, setInAppBrowser] = useState(false);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser(navigator.userAgent));
  }, []);

  return (
    <>
      <Button
        onClick={signIn}
        disabled={isSigningIn}
        variant="outline"
        className="h-11 w-full gap-2.5 text-sm font-semibold"
      >
        {isSigningIn ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleIcon className="size-4" />
        )}
        {isSigningIn ? "Signing in…" : "Continue with Google"}
      </Button>
      {inAppBrowser && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-800 dark:text-amber-300">
          Google sign-in doesn&apos;t work inside this app&apos;s browser. Tap the menu and choose{" "}
          <strong>Open in browser</strong>, then sign in.
        </p>
      )}
    </>
  );
}
