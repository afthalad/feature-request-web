import Link from "next/link";
import { Compass } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
          <Compass className="size-6" />
        </div>
        <div className="space-y-2">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">404</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Page not found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={buttonVariants()}>
            Back to home
          </Link>
          <Link href="/docs" className={buttonVariants({ variant: "outline" })}>
            Read the docs
          </Link>
        </div>
      </div>
    </>
  );
}
