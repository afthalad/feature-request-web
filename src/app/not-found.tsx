import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter, SiteNav } from "@/components/landing-v2/Chrome";
import { Halftone } from "@/components/landing-v2/Halftone";
import { Eyebrow } from "@/components/landing-v2/Sections";
import { jakarta } from "@/components/landing-v2/fonts";
import "@/components/landing-v2/v2.css";

export const metadata: Metadata = { title: "Page not found" };

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#board", label: "The board" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export default function NotFound() {
  return (
    <div className={`${jakarta.variable} v2-root flex flex-1 flex-col overflow-x-clip`}>
      <SiteNav links={NAV} />
      <main className="relative isolate flex flex-1 flex-col items-center justify-center px-4 pt-32 pb-24 text-center">
        <Halftone mode="corners" className="-z-10" />
        <Eyebrow>404</Eyebrow>
        <h1 className="mt-4 text-5xl leading-[1.05] tracking-[-0.045em] sm:text-6xl">Page not found.</h1>
        <p className="mt-5 max-w-md text-[var(--v2-fg-2)]">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={buttonVariants({ size: "lg", className: "h-12 rounded-xl px-6 text-base font-bold" })}>
            Back to home
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/docs" className="px-3 text-sm font-semibold text-[var(--v2-fg)] hover:text-[var(--v2-orange)]">
            Read the docs
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
