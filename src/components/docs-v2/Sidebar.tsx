"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Braces, ChevronDown, Workflow, type LucideIcon } from "lucide-react";
import { siAndroid, siApple, siFlutter, siLaravel, siNextdotjs, siReact, type SimpleIcon } from "simple-icons";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { DOCS_NAV } from "@/lib/docs/nav";
import { v2Docs } from "@/components/landing-v2/links";
import { cn } from "@/lib/utils";

/** Apple and Next.js logos are black, so they follow the text colour instead. */
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
    return <Icon aria-hidden className={cn("size-4 shrink-0", active && "text-[var(--v2-orange)]")} strokeWidth={2} />;
  }
  return (
    <BrandIcon aria-hidden path={icon.brand.path} color={icon.mono ? undefined : `#${icon.brand.hex}`} className="size-4 shrink-0" />
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Docs" className="space-y-7 text-sm">
      {DOCS_NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 font-mono text-[10.5px] font-medium tracking-[0.16em] text-[var(--v2-fg-3)] uppercase">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = v2Docs(item.href);
              const active = pathname === href;
              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors",
                      active
                        ? "bg-[var(--v2-orange)]/12 font-semibold text-[var(--v2-fg)]"
                        : "text-[var(--v2-fg-2)] hover:bg-[var(--v2-chip)] hover:text-[var(--v2-fg)]",
                    )}
                  >
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
    <aside className="hidden lg:block">
      <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto py-12 pr-2">
        <NavLinks />
      </div>
    </aside>
  );
}

/** Collapsible menu above the page content on small screens. */
export function DocsMobileNav() {
  const pathname = usePathname();
  const current = DOCS_NAV.flatMap((g) => g.items).find((page) => v2Docs(page.href) === pathname);

  return (
    <details className="group mt-4 rounded-2xl bg-[var(--v2-card)] shadow-[var(--v2-shadow)] lg:hidden" data-docs-menu>
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          <span className="font-normal text-[var(--v2-fg-3)]">Docs / </span>
          {current?.label ?? "Menu"}
        </span>
        <ChevronDown className="size-4 text-[var(--v2-fg-3)] transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-2 pt-1 pb-5">
        <NavLinks
          onNavigate={() => {
            document.querySelector<HTMLDetailsElement>("details[data-docs-menu]")?.removeAttribute("open");
          }}
        />
      </div>
    </details>
  );
}
