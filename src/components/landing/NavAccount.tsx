"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { resetAnalytics } from "@/lib/analytics/client";
import { auth } from "@/lib/firebase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Right side of the header: "Log in" and "Start free" for visitors, the
 * account menu for signed-in developers (e.g. while they read the docs).
 */
export function NavAccount() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}
        >
          Log in
        </Link>
        <Link href="/login" className={buttonVariants({ size: "sm" })}>
          Start free
        </Link>
      </>
    );
  }

  const initial = user.displayName?.[0] ?? user.email?.[0] ?? "?";

  async function handleSignOut() {
    await signOut(auth);
    resetAnalytics();
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <>
      <Link href="/dashboard" className={buttonVariants({ size: "sm", className: "hidden sm:inline-flex" })}>
        Dashboard
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account"
          className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar>
            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "Account"} />
            <AvatarFallback>{initial.toUpperCase()}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href="/dashboard" />}>Dashboard</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
