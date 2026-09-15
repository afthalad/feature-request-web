"use client";

import Link from "next/link";
import { LinkPendingSpinner } from "@/components/admin/LinkPendingSpinner";
import { cn } from "@/lib/utils";

interface AdminNavLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}

export function AdminNavLink({ href, isActive, children }: AdminNavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
      <LinkPendingSpinner />
    </Link>
  );
}
