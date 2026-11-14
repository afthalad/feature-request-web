import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/site";
import { COMPETITORS } from "@/lib/compare";
import { SiteFooter, SiteNav } from "@/components/landing-v2/Chrome";
import { Halftone } from "@/components/landing-v2/Halftone";
import { Reveal } from "@/components/landing-v2/Reveal";
import { Eyebrow } from "@/components/landing-v2/Sections";
import { jakarta } from "@/components/landing-v2/fonts";
import { BreadcrumbStructuredData } from "@/components/seo/StructuredData";
import { VsLockup } from "@/components/compare/Logos";
import "@/components/landing-v2/v2.css";

export const metadata: Metadata = pageMetadata({
  title: "Fewchurs alternatives and comparisons",
  description:
    "How Fewchurs compares with Canny, Featurebase and WishKit for in-app feature requests: native SDKs, platforms, pricing and when each one fits.",
  path: "/compare",
});

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/compare", label: "Compare" },
  { href: "/docs", label: "Docs" },
];

export default function CompareIndex() {
  return (
    <div className={`${jakarta.variable} v2-root flex flex-1 flex-col overflow-x-clip`}>
      <BreadcrumbStructuredData
        items={[
          { name: "Fewchurs", path: "/" },
          { name: "Compare", path: "/compare" },
        ]}
      />
      <SiteNav links={NAV} />

      <main className="flex-1">
        <section className="relative isolate px-4 pt-28 pb-16 sm:px-8 sm:pt-36 sm:pb-20">
          <Halftone mode="corners" className="-z-10 h-[520px]" />
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="v2-appear">Compare</Eyebrow>
            <h1
              className="v2-appear mt-4 text-[2.6rem] leading-[1.06] tracking-[-0.04em] text-balance sm:text-6xl"
              style={{ "--d": "80ms" } as React.CSSProperties}
            >
              Fewchurs and the alternatives.
            </h1>
            <p
              className="v2-appear mx-auto mt-6 max-w-xl text-base leading-relaxed text-balance text-[var(--v2-fg-2)] sm:text-lg"
              style={{ "--d": "160ms" } as React.CSSProperties}
            >
              Honest side-by-sides with other feature request tools, including where they&apos;re the better pick.
            </p>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-8 sm:pb-28">
          <Reveal className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {COMPETITORS.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group flex flex-col rounded-2xl bg-[var(--v2-card)] p-6 shadow-[var(--v2-shadow)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="mb-5 flex justify-start">
                  <VsLockup logo={c.logo} size={44} />
                </div>
                <h2 className="text-2xl tracking-[-0.03em]">Fewchurs vs {c.name}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--v2-fg-2)]">{c.blurb}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--v2-fg)] group-hover:text-[var(--v2-orange)]">
                  Compare with {c.name}
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
