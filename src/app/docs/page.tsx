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
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-4 py-16">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
          <p className="text-muted-foreground">Pick your platform to get started.</p>
        </div>
        <PlatformGrid />
      </div>
    </>
  );
}
