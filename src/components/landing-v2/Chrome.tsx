import Link from "next/link";
import Image from "next/image";
import { siWebflow, siWordpress } from "simple-icons";
import { NavAccount } from "@/components/landing/NavAccount";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { COMPETITORS } from "@/lib/compare";

/** Header and footer shared by the home page and the docs. */

/** Platforms on the way. Bubble has no icon in simple-icons, so it gets a monogram. */
export const COMING_SOON: { id: string; name: string; path?: string; color?: string }[] = [
  { id: "wordpress", name: "WordPress", path: siWordpress.path, color: `#${siWordpress.hex}` },
  { id: "webflow", name: "Webflow", path: siWebflow.path, color: `#${siWebflow.hex}` },
  { id: "bubble", name: "Bubble" },
];

export function SiteNav({ links, sticky = false }: { links: { href: string; label: string }[]; sticky?: boolean }) {
  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-40 px-4 sm:px-8",
        sticky
          ? "sticky bg-[color-mix(in_oklch,var(--v2-bg)_82%,transparent)] backdrop-blur-md"
          : "absolute",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.03em]">
          {/* The image carries the name; the wordmark beside it is hidden from screen readers. */}
          <Image src="/logo-mark.svg" alt="Fewchurs" width={28} height={28} priority className="size-7" />
          <span aria-hidden>fewchurs</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-semibold md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-[var(--v2-fg)] hover:text-[var(--v2-orange)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <NavAccount />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--v2-line)] px-4 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <span className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.03em]">
            <Image src="/logo-mark.svg" alt="Fewchurs" width={24} height={24} className="size-6" />
            <span aria-hidden>fewchurs</span>
          </span>
          <p className="max-w-xs text-sm text-[var(--v2-fg-3)]">Feature requests, votes and a public roadmap for your app.</p>
        </div>
        <FooterCol title="Product">
          <FooterLink href="/#how">How it works</FooterLink>
          <FooterLink href="/pricing">Pricing</FooterLink>
          <FooterLink href="/docs">Docs</FooterLink>
          <FooterLink href="/login">Log in</FooterLink>
        </FooterCol>
        <FooterCol title="Platforms">
          {PLATFORMS.map((p) => (
            <FooterLink key={p.id} href={p.href ?? "/docs"}>
              {p.name}
            </FooterLink>
          ))}
          {COMING_SOON.map((p) => (
            <li key={p.id} className="py-1.5 text-[var(--v2-fg-3)] sm:py-0">
              {p.name} <span className="text-xs font-bold tracking-wide text-[var(--v2-orange)] uppercase">Soon</span>
            </li>
          ))}
        </FooterCol>
        <FooterCol title="Compare">
          {COMPETITORS.map((c) => (
            <FooterLink key={c.slug} href={`/compare/${c.slug}`}>
              vs {c.name}
            </FooterLink>
          ))}
          <FooterLink href="/compare">All comparisons</FooterLink>
        </FooterCol>
        <FooterCol title="Support">
          <li>
            <a className="inline-block py-1.5 text-[var(--v2-fg-2)] hover:text-[var(--v2-fg)] sm:py-0" href="mailto:support@fewchurs.com">
              support@fewchurs.com
            </a>
          </li>
        </FooterCol>
      </div>
      <div className="mx-auto max-w-6xl border-t border-[var(--v2-line)] py-6 text-xs text-[var(--v2-fg-3)]">
        © {new Date().getFullYear()} Fewchurs
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[var(--v2-fg-3)] uppercase">{title}</p>
      <ul className="space-y-1 text-sm sm:space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      {/* Taller on phones so each link is an easy tap target. */}
      <Link className="inline-block py-1.5 text-[var(--v2-fg-2)] hover:text-[var(--v2-fg)] sm:py-0" href={href}>
        {children}
      </Link>
    </li>
  );
}
