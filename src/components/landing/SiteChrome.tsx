import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PLATFORMS } from "@/lib/platforms";
import { FrameSection } from "@/components/landing-v2/Frame";
import { BouncyWordmark } from "@/components/landing-v2/BouncyWordmark";
import { DOCS_HOME, toV2 } from "@/components/docs-v2/nav";

/** Header shared by the new landing page and the new docs. */
export function SiteNav({ links }: { links: { href: string; label: string }[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4">
        <Logo href="/landing" />
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}
          >
            Log in
          </Link>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Footer with link columns and the bouncing wordmark. */
export function SiteFooter() {
  return (
    <footer>
      <FrameSection>
        <div className="grid gap-10 px-5 py-14 sm:grid-cols-2 sm:px-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo href="/landing" />
            <p className="max-w-xs text-sm text-muted-foreground">
              Feature requests, votes and a public roadmap for your app.
            </p>
          </div>
          <div>
            <p className="mb-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Product</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="hover:text-primary" href="/landing#pricing">
                  Pricing
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href={DOCS_HOME}>
                  Docs
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/login">
                  Log in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Platforms</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {PLATFORMS.map((p) => (
                <li key={p.id}>
                  <Link className="hover:text-primary" href={toV2(p.href ?? "/docs")}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="px-2 pt-6 sm:px-6">
          <BouncyWordmark />
        </div>
        <div className="flex flex-col gap-2 border-t border-border px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-10">
          <span>© {new Date().getFullYear()} Fewchurs</span>
          <span>Hover or tap the letters.</span>
        </div>
      </FrameSection>
    </footer>
  );
}
