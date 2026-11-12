"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/marketing/GoogleIcon";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";

/** The only interactive part of the login page, so the rest stays server-rendered. */
export function GoogleSignInButton() {
  const { signIn, isSigningIn } = useGoogleSignIn({ resumeSession: true });

  return (
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
  );
}
