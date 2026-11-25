import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function DocsSignUpBanner() {
  return (
    <div className="bg-[var(--v2-orange)] px-4 py-2 text-center text-sm font-medium text-white sm:px-8">
      <span aria-hidden>👋 </span>
      Enjoying the docs? Start building free, no credit card needed.{" "}
      <Link href="/login?from=docs-banner" className="font-bold whitespace-nowrap underline underline-offset-4">
        Get started →
      </Link>
    </div>
  );
}

export function DocsSignUpCard() {
  return (
    <div className="rounded-2xl bg-[var(--v2-card)] p-5 shadow-[var(--v2-shadow)]">
      <p className="font-bold tracking-[-0.01em]">Try Fewchurs free</p>
      <p className="mt-1 text-sm text-[var(--v2-fg-3)]">No credit card needed.</p>
      <Link
        href="/login?from=docs-sidebar"
        className={buttonVariants({ size: "sm", className: "mt-4 w-full font-semibold" })}
      >
        Get started
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

export function DocsSignUpFooter() {
  return (
    <aside className="mt-20 rounded-3xl bg-[var(--v2-orange-wash)] p-7 sm:p-9">
      <p className="text-2xl font-extrabold tracking-[-0.035em]">Ready to use this in your project?</p>
      <p className="mt-2 leading-7 text-[var(--v2-fg-2)]">
        Create a free account. It takes 2 minutes and no credit card is required. Fewchurs has a{" "}
        <Link
          href="/pricing"
          className="font-semibold text-[var(--v2-fg)] underline decoration-[var(--v2-orange)]/50 underline-offset-4 hover:text-[var(--v2-orange)]"
        >
          free plan with no credit card required
        </Link>
        .
      </p>
      <Link
        href="/login?from=docs-footer"
        className={buttonVariants({ size: "lg", className: "mt-6 h-11 rounded-xl px-6 font-bold" })}
      >
        Create a free account
        <ArrowRight className="size-4" />
      </Link>
    </aside>
  );
}
