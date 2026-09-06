"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  const initial = user?.displayName?.[0] ?? user?.email?.[0] ?? "?";

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <Avatar>
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "Account"} />
                <AvatarFallback>{initial.toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/pricing" />}>Pricing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
