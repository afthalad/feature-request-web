import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { pageMetadata } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { SiteFooter, SiteNav } from "@/components/landing-v2/Chrome";
import { Halftone } from "@/components/landing-v2/Halftone";
import { Reveal } from "@/components/landing-v2/Reveal";
import { Eyebrow, FaqSection } from "@/components/landing-v2/Sections";
import { jakarta } from "@/components/landing-v2/fonts";
import { cn } from "@/lib/utils";
import "@/components/landing-v2/v2.css";

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description:
    "Free forever for one app. Starter is $9/mo for 3 apps, Pro is $24/mo for 5 apps and a public board. Yearly gets 2 months free.",
  path: "/pricing",
});

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#board", label: "The board" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

interface PlanRow {
  label: string;
  free: string | boolean;
  starter: string | boolean;
  pro: string | boolean;
}

const ROWS: PlanRow[] = [
  { label: "Apps", free: "1", starter: "3", pro: "5" },
  { label: "Platforms (iOS, Android, web)", free: "One", starter: "All", pro: "All" },
  { label: "Visible feature requests per app", free: "First 5", starter: "First 200", pro: "All" },
  { label: "Feature requests collected", free: "Unlimited", starter: "Unlimited", pro: "Unlimited" },
  { label: "Votes", free: "Unlimited", starter: "Unlimited", pro: "Unlimited" },
  { label: "Comments", free: "Unlimited", starter: "Unlimited", pro: "Unlimited" },
  { label: "Email for every new request", free: true, starter: true, pro: true },
  { label: "Full details in those emails", free: "First 5", starter: "First 200", pro: "All" },
  { label: '"Powered by" badge in the SDK', free: "Shown", starter: "Removed", pro: "Removed" },
  { label: "Custom colours in the SDK", free: true, starter: true, pro: true },
  { label: "Public board with your own link", free: false, starter: false, pro: true },
  { label: "Export to CSV", free: false, starter: false, pro: true },
];

const PLAN_COLUMNS = [
  { key: "free", label: "Free" },
  { key: "starter", label: "Starter" },
  { key: "pro", label: "Pro" },
] as const;

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="mx-auto grid size-5 place-items-center rounded-full bg-[var(--v2-orange)]/15 text-[var(--v2-orange)]">
        <Check aria-hidden className="size-3" strokeWidth={3} />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus aria-hidden className="mx-auto size-4 text-[var(--v2-fg-3)] opacity-60" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span>{value}</span>;
}

export default function PricingPage() {
  return (
    <div className={`${jakarta.variable} v2-root flex flex-1 flex-col overflow-x-clip`}>
      <SiteNav links={NAV} />

      <main className="flex-1">
        {/* Hero + plans */}
        <section className="relative isolate px-4 pt-28 pb-20 sm:px-8 sm:pt-36 sm:pb-28">
          <Halftone mode="corners" className="-z-10 h-[620px]" />
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow className="v2-appear">Pricing</Eyebrow>
              <h1
                className="v2-appear mt-4 text-[2.6rem] leading-[1.06] tracking-[-0.04em] text-balance sm:text-6xl"
                style={{ "--d": "80ms" } as React.CSSProperties}
              >
                Start free. Upgrade when you&apos;re shipping.
              </h1>
              <p
                className="v2-appear mx-auto mt-6 max-w-xl text-base leading-relaxed text-balance text-[var(--v2-fg-2)] sm:text-lg"
                style={{ "--d": "160ms" } as React.CSSProperties}
              >
                Free forever for a hobby project. Every plan collects unlimited requests, votes and comments, emails
                you about each one, and lets you use your own colours.
              </p>
            </div>
            <div className="v2-appear" style={{ "--d": "240ms" } as React.CSSProperties}>
              <h2 className="sr-only">Plans</h2>
              <PricingPlans />
            </div>
          </div>
        </section>

        {/* Compare */}
        <section id="compare" className="scroll-mt-8 px-4 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-5xl">
            <Reveal className="text-center">
              <Eyebrow>Compare plans</Eyebrow>
              <h2 className="mt-3 text-4xl leading-[1.05] tracking-[-0.04em] text-balance sm:text-5xl">
                Everything in each plan.
              </h2>
            </Reveal>

            <Reveal className="mt-10">
              <div className="overflow-hidden rounded-2xl bg-[var(--v2-card)] shadow-[var(--v2-shadow)]">
                <table className="w-full table-fixed text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[var(--v2-chip)]">
                      <th scope="col" className="w-[34%] px-3 py-4 font-semibold sm:w-[40%] sm:px-6">
                        <span className="font-mono text-xs font-medium tracking-[0.14em] text-[var(--v2-fg-3)] uppercase">
                          Feature
                        </span>
                      </th>
                      {PLAN_COLUMNS.map((plan) => (
                        <th
                          key={plan.key}
                          scope="col"
                          className={cn(
                            "px-1.5 py-4 text-center text-sm font-bold sm:px-3 sm:text-base",
                            plan.key === "pro" && "bg-[var(--v2-orange)]/10 text-[var(--v2-orange)]",
                          )}
                        >
                          {plan.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--v2-line)]">
                    {ROWS.map((row) => (
                      <tr key={row.label}>
                        <th scope="row" className="px-3 py-3.5 font-semibold sm:px-6 sm:py-4">
                          {row.label}
                        </th>
                        {PLAN_COLUMNS.map((plan) => (
                          <td
                            key={plan.key}
                            className={cn(
                              "px-1.5 py-3.5 text-center text-[var(--v2-fg-2)] sm:px-3 sm:py-4",
                              plan.key === "pro" && "bg-[var(--v2-orange)]/[0.05] text-[var(--v2-fg)]",
                            )}
                          >
                            <Cell value={row[plan.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-center text-xs text-[var(--v2-fg-3)]">
                Prices in USD. Yearly plans get 2 months free. Cancel any time.
              </p>
            </Reveal>
          </div>
        </section>

        <FaqSection />

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-8 sm:pb-24">
          <Reveal className="mx-auto max-w-6xl">
            <div className="relative isolate overflow-hidden rounded-3xl bg-[var(--v2-raised)] px-6 py-14 text-center shadow-[var(--v2-shadow)] sm:px-12 sm:py-16">
              <Halftone mode="right" className="-z-10 opacity-70" />
              <h2 className="mx-auto max-w-xl text-4xl leading-[1.05] tracking-[-0.04em] text-balance sm:text-5xl">
                Your first board is free.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[var(--v2-fg-2)]">
                Add the SDK in about five minutes. Upgrade only when you need more apps.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login"
                  className={buttonVariants({ size: "lg", className: "h-12 rounded-xl px-6 text-base font-bold" })}
                >
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/docs" className="px-3 py-3 text-sm font-semibold text-[var(--v2-fg)] hover:text-[var(--v2-orange)]">
                  Read the docs
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
