"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { DOCS_NAV, DOCS_PAGES } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6 text-sm">
      {DOCS_NAV.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="text-foreground px-2.5 pb-1 text-xs font-semibold">{group.title}</p>
          {group.items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 transition-colors",
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {item.label}
                {item.badge === "soon" && (
                  <span className="text-muted-foreground rounded border border-border px-1.5 py-px text-[10px] font-medium">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Left column on large screens. */
export function DocsSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-10">
        <NavLinks />
      </div>
    </aside>
  );
}

/** Collapsible menu above the page content on small screens. */
export function DocsMobileNav() {
  const pathname = usePathname();
  const current = DOCS_PAGES.find((page) => page.href === pathname);

  return (
    <details className="group mb-8 rounded-lg border border-border lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>
          <span className="text-muted-foreground font-normal">Docs / </span>
          {current?.label ?? "Menu"}
        </span>
        <ChevronDown className="text-muted-foreground size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border p-3">
        <NavLinks
          onNavigate={() => {
            document.querySelector<HTMLDetailsElement>("details[open]")?.removeAttribute("open");
          }}
        />
      </div>
    </details>
  );
}
