import type { Metadata } from "next";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { PlatformGrid } from "@/components/docs/PlatformGrid";

export const metadata: Metadata = {
  title: "Docs — Fewchurs",
  description: "Integrate Fewchurs into your app.",
};

export default function DocsPage() {
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-10 px-4 py-20">
        <div className="space-y-2 text-center">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            Documentation
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Pick your platform</h1>
          <p className="text-muted-foreground mx-auto max-w-xl">
            A few lines of code and your users have a place to ask for what they want.
          </p>
        </div>
        <PlatformGrid />
      </div>
    </>
  );
}
