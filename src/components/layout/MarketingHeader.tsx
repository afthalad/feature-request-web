"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGoogleSignIn } from "@/lib/auth/useGoogleSignIn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

export function MarketingHeader() {
  const router = useRouter();
  const { signIn, isSigningIn } = useGoogleSignIn();
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setAuthResolved(true);
      }),
    [],
  );

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  const initial = user?.displayName?.[0] ?? user?.email?.[0] ?? "?";

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4">
        <Logo href={authResolved && user ? "/dashboard" : "/"} />
        <div className="flex items-center gap-1">
          <Link
            href="/docs"
            className="text-muted-foreground px-3 text-sm hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground px-3 text-sm hover:text-foreground"
          >
            Pricing
          </Link>
          {authResolved && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Avatar>
                  <AvatarImage
                    src={user.photoURL ?? undefined}
                    alt={user.displayName ?? "Account"}
                  />
                  <AvatarFallback>{initial.toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              onClick={signIn}
              disabled={isSigningIn}
              variant="default"
            >
              {isSigningIn ? "Signing in..." : "Sign in"}
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
