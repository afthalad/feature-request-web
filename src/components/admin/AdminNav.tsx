"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/apps", label: "Apps" },
  { href: "/admin/api-keys", label: "API Keys" },
  { href: "/admin/unsubscribes", label: "Unsubscribes" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Dashboard
          </Link>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
      <nav className="mx-auto flex max-w-[1100px] gap-1 overflow-x-auto px-4 pb-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
