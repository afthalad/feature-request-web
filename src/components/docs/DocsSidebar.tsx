"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Braces, ChevronDown, Workflow, type LucideIcon } from "lucide-react";
import { siAndroid, siApple, siFlutter, siLaravel, siNextdotjs, siReact, type SimpleIcon } from "simple-icons";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { DOCS_NAV, DOCS_PAGES } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

/**
 * An icon in front of every docs link, so a stack can be spotted at a glance.
 * Apple and Next.js logos are black, so they follow the text colour instead
 * of their brand colour (otherwise they vanish in dark mode).
 */
const ICONS: Record<string, { brand: SimpleIcon; mono?: boolean } | { lucide: LucideIcon }> = {
  "/docs": { lucide: BookOpen },
  "/docs/concepts": { lucide: Workflow },
  "/docs/swiftui": { brand: siApple, mono: true },
  "/docs/kotlin": { brand: siAndroid },
  "/docs/flutter": { brand: siFlutter },
  "/docs/react": { brand: siReact },
  "/docs/nextjs": { brand: siNextdotjs, mono: true },
  "/docs/laravel": { brand: siLaravel },
  "/docs/api": { lucide: Braces },
};

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const icon = ICONS[href];
  if (!icon) return null;
  if ("lucide" in icon) {
    const Icon = icon.lucide;
    return <Icon aria-hidden className={cn("size-4 shrink-0", active && "text-primary")} strokeWidth={1.75} />;
  }
  return (
    <BrandIcon
      aria-hidden
      path={icon.brand.path}
      color={icon.mono ? undefined : `#${icon.brand.hex}`}
      className="size-4 shrink-0"
    />
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Docs" className="space-y-7 text-sm">
      {DOCS_NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
            <span className="text-primary">[</span> {group.title} <span className="text-primary">]</span>
          </p>
          <ul className="space-y-px">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-md px-3 py-1.5 transition-colors",
                      active
                        ? "bg-primary/[0.08] font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />}
                    <NavIcon href={item.href} active={active} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Left column on large screens. */
export function DocsSidebar() {
  return (
    <aside className="hidden border-r border-border lg:block">
      <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-10">
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
    <details className="group border-b border-border lg:hidden" data-docs-menu>
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-medium sm:px-10 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="font-normal text-muted-foreground">Docs / </span>
          {current?.label ?? "Menu"}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-2 py-5 sm:px-7">
        <NavLinks
          onNavigate={() => {
            document.querySelector<HTMLDetailsElement>("details[data-docs-menu]")?.removeAttribute("open");
          }}
        />
      </div>
    </details>
  );
}
