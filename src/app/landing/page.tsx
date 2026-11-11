import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { PLATFORMS } from "@/lib/platforms";
import { FrameSection, Eyebrow, SectionHeading } from "@/components/landing-v2/Frame";
import { PhysicsPit } from "@/components/landing-v2/PhysicsPit";
import { ToggleHeadline } from "@/components/landing-v2/ToggleHeadline";
import { VideoShowcase } from "@/components/landing-v2/VideoShowcase";
import { CodeTabs } from "@/components/landing-v2/CodeTabs";
import { Bento } from "@/components/landing-v2/Bento";
import { SiteFooter, SiteNav } from "@/components/landing-v2/SiteChrome";
import { DOCS_HOME, toV2 } from "@/components/docs-v2/nav";
import "@/components/landing-v2/landing.css";

export const metadata: Metadata = {
  title: "Fewchurs - Let your users tell you what to build next",
  description:
    "Drop the Fewchurs SDK into your app and turn scattered feedback into a ranked, shippable roadmap.",
  // A design preview of the home page: keep it out of search results so it
  // doesn't compete with "/".
  robots: { index: false, follow: true },
};

const FAQ = [
  { q: "Do I need a backend?", a: "No. Fewchurs is the backend. Add the SDK and you're done." },
  {
    q: "What's on the free plan?",
    a: "One app on one platform, the first 5 feature requests visible, unlimited votes and comments. Free forever.",
  },
  { q: "Can users vote without an account?", a: "Yes, anonymously by device. No login required for anyone but you." },
  {
    q: "Do I need to build the UI?",
    a: "No. The SDK renders the whole board. On Pro you can also link to a public web board.",
  },
  { q: "Can I remove the badge?", a: 'Yes, on Starter and Pro. The "Powered by" badge only shows on Free.' },
  {
    q: "What if I have more than one app?",
    a: "Free covers 1 app on one platform. Starter covers 3 apps and Pro 5, all on every platform. Every app gets its own board and API key.",
  },
];

const INSTALL_POINTS = [
  "No backend to run. Fewchurs is the backend.",
  "Users vote without signing up, by device.",
  "The same board on iOS, Android, Flutter and the web.",
];

const NAV_LINKS = [
  { href: "#install", label: "Install" },
  { href: "#board", label: "The board" },
  { href: "#pricing", label: "Pricing" },
  { href: DOCS_HOME, label: "Docs" },
];

export default function LandingV2() {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip bg-background text-foreground">
      <SiteNav links={NAV_LINKS} />

      <main className="flex-1">
        {/* Hero */}
        <FrameSection corners={false} className="[&>div]:border-t-0">
          <div className="grid lg:grid-cols-[1fr_1.08fr]">
            <div className="flex flex-col justify-center gap-7 px-5 py-14 sm:px-10 sm:py-20 lg:py-24">
              <Eyebrow className="lv2-rise">Feature requests for your app</Eyebrow>
              <h1
                className="lv2-rise text-[clamp(2.6rem,6.4vw,5rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-balance"
                style={{ animationDelay: "60ms" }}
              >
                Let your users tell you what to build <span className="text-primary">next.</span>
              </h1>
              <p
                className="lv2-rise max-w-md text-lg leading-relaxed text-muted-foreground"
                style={{ animationDelay: "120ms" }}
              >
                Drop the Fewchurs SDK into your app and turn scattered feedback into a ranked, shippable roadmap.
              </p>
              <div className="lv2-rise flex flex-wrap items-center gap-3" style={{ animationDelay: "180ms" }}>
                <Link href="/login" className={buttonVariants({ size: "lg", className: "h-12 px-6 text-base" })}>
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={DOCS_HOME}
                  className={buttonVariants({ variant: "outline", size: "lg", className: "h-12 px-6 text-base" })}
                >
                  Read the docs
                </Link>
              </div>
              <p className="lv2-rise text-sm text-muted-foreground" style={{ animationDelay: "240ms" }}>
                Free forever for one app. No credit card.
              </p>
            </div>

            <div className="relative flex flex-col border-t border-border lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex gap-1 text-xs font-medium" aria-hidden>
                  <span className="rounded-md bg-muted px-2.5 py-1 text-foreground">Top</span>
                  <span className="px-2.5 py-1 text-muted-foreground">New</span>
                  <span className="px-2.5 py-1 text-muted-foreground">Roadmap</span>
                </div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Drag · throw · vote
                </span>
              </div>
              <PhysicsPit className="h-[440px] sm:h-[480px] lg:h-auto lg:min-h-[520px] lg:flex-1" />
            </div>
          </div>
        </FrameSection>

        {/* Platforms */}
        <FrameSection id="platforms" aria-label="Platforms">
          <div className="flex flex-col gap-1 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <Eyebrow>Works where your app lives</Eyebrow>
            <p className="text-sm text-muted-foreground">One SDK per platform, the same board everywhere.</p>
          </div>
          <ul className="grid grid-cols-3 border-t border-border md:grid-cols-6">
            {PLATFORMS.map((p, i) => (
              <li
                key={p.id}
                className={
                  "border-border " +
                  (i % 3 !== 2 ? "border-r " : "md:border-r ") +
                  (i < 3 ? "border-b md:border-b-0 " : "") +
                  (i === PLATFORMS.length - 1 ? "md:border-r-0" : "")
                }
              >
                <Link
                  href={toV2(p.href ?? "/docs")}
                  className="group flex h-24 flex-col items-center justify-center gap-2 transition-colors hover:bg-muted/50 sm:h-28"
                >
                  <BrandIcon
                    path={p.iconPath}
                    className="size-6 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:[fill:var(--brand)]"
                    style={{ "--brand": p.iconColor } as React.CSSProperties}
                  />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {p.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </FrameSection>

        {/* Toggle headline */}
        <FrameSection innerClassName="px-5 py-20 sm:px-10 sm:py-28">
          <ToggleHeadline />
        </FrameSection>

        {/* Video */}
        <FrameSection id="demo">
          <VideoShowcase />
        </FrameSection>

        {/* Install */}
        <FrameSection id="install">
          <div className="grid items-center gap-12 px-5 py-16 sm:px-10 sm:py-24 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="Install"
                title="A few lines of code. A whole board."
                body="Add the SDK, pass your key, and your users can suggest, vote and follow, right inside your app."
              />
              <ul className="space-y-3">
                {INSTALL_POINTS.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm sm:text-base">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href={DOCS_HOME}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
              >
                Read the docs
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <CodeTabs />
          </div>
        </FrameSection>

        {/* Bento */}
        <FrameSection id="board">
          <div className="px-5 py-16 sm:px-10 sm:py-20">
            <SectionHeading
              eyebrow="The board"
              title="Everything between “I wish it could…” and “It shipped.”"
            />
          </div>
          <div className="border-t border-border">
            <Bento />
          </div>
        </FrameSection>

        {/* Pricing */}
        <FrameSection id="pricing">
          <div className="lv2-pricing space-y-12 px-5 py-16 sm:px-10 sm:py-24">
            <SectionHeading
              eyebrow="Pricing"
              title="Free for your first app. Simple after that."
              body="Start free on one platform. Upgrade when you have more apps or want the badge gone."
            />
            <PricingPlans />
          </div>
        </FrameSection>

        {/* FAQ */}
        <FrameSection>
          <div className="grid gap-10 px-5 py-16 sm:px-10 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading eyebrow="FAQ" title="Questions, answered." />
            <div className="divide-y divide-border border-y border-border">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-base font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden
                      className="relative size-3 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-current after:transition-transform after:duration-300 group-open:after:scale-y-0"
                    />
                  </summary>
                  <p className="pb-5 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </FrameSection>

        {/* CTA */}
        <FrameSection>
          <div className="relative overflow-hidden px-5 py-24 text-center sm:px-10 sm:py-32">
            <div aria-hidden className="lv2-diamonds absolute inset-0" />
            <div className="relative mx-auto max-w-3xl space-y-8">
              <h2 className="text-[clamp(2.2rem,5.6vw,4.5rem)] leading-[1] font-semibold tracking-[-0.05em] text-balance">
                Your users already know what to build next.
              </h2>
              <p className="mx-auto max-w-lg text-lg text-muted-foreground">Give them somewhere to say it.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/login" className={buttonVariants({ size: "lg", className: "h-12 px-6 text-base" })}>
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={DOCS_HOME}
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "h-12 bg-background px-6 text-base",
                  })}
                >
                  Read the docs
                </Link>
              </div>
            </div>
          </div>
        </FrameSection>
      </main>

      <SiteFooter />
    </div>
  );
}
