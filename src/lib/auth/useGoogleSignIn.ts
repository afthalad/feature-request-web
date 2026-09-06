"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { auth, googleAuthProvider } from "@/lib/firebase/client";

export function useGoogleSignIn() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signIn() {
    setIsSigningIn(true);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) throw new Error("Failed to create session");

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Sign in failed. Please try again.");
      setIsSigningIn(false);
    }
  }

  return { signIn, isSigningIn };
}
