"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";

export function MarketingHeader() {
  const { signIn, isSigningIn } = useGoogleSignIn();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-1">
          <Link href="/docs" className="text-muted-foreground px-3 text-sm hover:text-foreground">
            Docs
          </Link>
          <Link href="/pricing" className="text-muted-foreground px-3 text-sm hover:text-foreground">
            Pricing
          </Link>
          <button
            type="button"
            onClick={signIn}
            disabled={isSigningIn}
            className="text-muted-foreground px-3 text-sm hover:text-foreground disabled:opacity-50"
          >
            {isSigningIn ? "Signing in..." : "Sign in"}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
