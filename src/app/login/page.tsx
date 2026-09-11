"use client";

import Link from "next/link";
import { X, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/marketing/GoogleIcon";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";

const PREVIEW_ROWS = [
  { title: "Add dark mode", votes: 8, status: "Planned" },
  { title: "Sync with calendar", votes: 4, status: "Pending" },
  { title: "Export to CSV", votes: 2, status: "Done" },
];

export default function LoginPage() {
  const { signIn, isSigningIn } = useGoogleSignIn();

  return (
    <div className="bg-muted min-h-screen p-3 sm:p-6">
      <div className="bg-card relative mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-xl border border-border md:grid-cols-2">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground absolute top-5 right-5 z-10 transition-colors"
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </Link>

        {/* Left: sign-in */}
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm space-y-8">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-sm font-bold">
              F
            </span>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Sign in to Fewchurs</h1>
              <p className="text-muted-foreground text-sm">
                Your free account is created automatically the first time you sign in.
              </p>
            </div>
            <Button
              onClick={signIn}
              disabled={isSigningIn}
              className="h-12 w-full"
              variant="outline"
            >
              <GoogleIcon className="size-4" />
              {isSigningIn ? "Signing in..." : "Continue with Google"}
            </Button>
            <p className="text-muted-foreground text-xs">
              By continuing, you agree to sign in with your Google account.
            </p>
          </div>
        </div>

        {/* Right: proof panel */}
        <div className="bg-muted/40 border-border hidden flex-col justify-center gap-8 border-l px-10 py-16 md:flex">
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
              What you get
            </p>
            <div className="bg-card border-border space-y-2 rounded-xl border p-4">
              <p className="text-muted-foreground px-1 text-xs font-medium">Feature requests</p>
              {PREVIEW_ROWS.map((row) => (
                <div
                  key={row.title}
                  className="border-border bg-background flex items-center gap-2 rounded-lg border p-2"
                >
                  <div className="text-primary flex w-8 shrink-0 flex-col items-center">
                    <ChevronUp className="size-3" />
                    <span className="text-xs font-medium">{row.votes}</span>
                  </div>
                  <p className="min-w-0 flex-1 truncate text-xs font-medium">{row.title}</p>
                  <span className="text-muted-foreground text-[10px]">{row.status}</span>
                </div>
              ))}
            </div>
          </div>
          <blockquote className="space-y-2">
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              &ldquo;Three lines of code and I had a board. That&apos;s the entire pitch, and
              it&apos;s true.&rdquo;
            </p>
            <footer className="text-muted-foreground/70 text-xs">
              iOS contractor — Sample quote
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
