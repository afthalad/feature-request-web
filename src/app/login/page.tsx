"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { GoogleIcon } from "@/components/marketing/GoogleIcon";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS = [
  { title: "Dark mode", votes: 42, status: "Planned", dot: "bg-blue-500", top: true },
  { title: "Sync with calendar", votes: 18, status: "Pending", dot: "bg-muted-foreground" },
  { title: "Export to CSV", votes: 9, status: "Done", dot: "bg-emerald-500" },
];

const PERKS = ["Free forever for one app", "No credit card needed", "Three lines of code to set up"];

export default function LoginPage() {
  const { signIn, isSigningIn } = useGoogleSignIn();

  return (
    <div className="bg-muted relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* soft brand glow behind the card */}
      <div
        aria-hidden
        className="bg-primary/15 pointer-events-none absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      />

      <div className="relative w-full max-w-sm md:max-w-[52rem]">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="bg-card grid overflow-hidden rounded-3xl border border-border shadow-lift md:grid-cols-[1fr_1.05fr]">
          {/* Sign in */}
          <div className="flex flex-col justify-center gap-7 p-7 sm:p-10">
            <Logo />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Welcome to Fewchurs</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sign in to see what your users are asking for. New here? Your free account is
                created automatically.
              </p>
            </div>

            <div className="space-y-3">
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
              <p className="text-muted-foreground text-center text-xs">
                We only use your Google account to sign you in.
              </p>
            </div>

            <ul className="space-y-2 border-t border-border pt-6 md:hidden">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm">
                  <Check className="text-primary size-4 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {/* What you get */}
          <div className="bg-primary-soft hidden flex-col justify-center gap-6 border-l border-border p-10 md:flex">
            <div className="space-y-1.5">
              <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
                What you get
              </p>
              <p className="text-lg font-semibold text-balance">
                A ranked list of what your users actually want.
              </p>
            </div>

            <div className="bg-card space-y-2 rounded-2xl border border-border p-3 shadow-lift">
              {PREVIEW_ROWS.map((row) => (
                <div
                  key={row.title}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-2.5",
                    row.top ? "border-primary/30 bg-primary-soft" : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "flex w-9 shrink-0 flex-col items-center rounded-lg py-1",
                      row.top ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    <ChevronUp className="size-3.5" />
                    <span className="text-[11px] font-semibold tabular-nums">{row.votes}</span>
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{row.title}</p>
                  <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                    <span className={cn("size-1.5 rounded-full", row.dot)} />
                    {row.status}
                  </span>
                </div>
              ))}
            </div>

            <ul className="space-y-2">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm">
                  <span className="bg-primary text-primary-foreground flex size-4.5 items-center justify-center rounded-full">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
