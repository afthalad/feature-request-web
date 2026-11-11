import Link from "next/link";
import { Check, KeyRound } from "lucide-react";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { buttonVariants } from "@/components/ui/button";
import { listAppPlatforms } from "@/lib/apps/appIds";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { App, AppPlatformId } from "@/types";

/** The SDKs that fit each platform an app can be set up for. */
const SDKS_FOR: Record<AppPlatformId, string[]> = {
  ios: ["swiftui", "flutter"],
  android: ["kotlin", "flutter"],
  web: ["nextjs", "react", "laravel"],
};

function sdksFor(app: App) {
  const platforms = listAppPlatforms(app);
  const ids = platforms.length ? new Set(platforms.flatMap((p) => SDKS_FOR[p])) : null;
  return PLATFORMS.filter((sdk) => sdk.href && (!ids || ids.has(sdk.id)));
}

/**
 * Shown in place of the stats until the first feature request arrives: the account has an app
 * but nothing is using it yet, so the one useful thing to show is how to connect it.
 */
export function SetupChecklist({ app }: { app: App }) {
  const sdks = sdksFor(app);

  return (
    <section aria-labelledby="setup-title" className="bg-surface rounded-xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 id="setup-title" className="text-lg font-semibold">
            Get {app.name} collecting requests
          </h2>
          <p className="text-muted-foreground text-sm">
            Two steps left. Most people are done in about five minutes.
          </p>
        </div>
        <p className="text-muted-foreground text-xs font-medium tabular-nums">1 of 3 done</p>
      </div>

      <div
        className="bg-border mt-4 h-1 overflow-hidden rounded-full"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={1}
      >
        <div className="bg-primary h-full w-1/3 rounded-full" />
      </div>

      <ol className="mt-6 space-y-6">
        <Step state="done" title="Create your app" />

        <Step
          state="current"
          number={2}
          title="Add the SDK to your app"
          description="Install the package for your stack and paste in your API key. The key is only shown once, so get a new one in settings if you didn't save it."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/apps/${app.id}/settings#api-key`}
              className={buttonVariants({ size: "sm" })}
            >
              <KeyRound />
              Get your API key
            </Link>
            {sdks.map((sdk) => (
              <Link
                key={sdk.id}
                href={sdk.href!}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <BrandIcon
                  path={sdk.iconPath}
                  // Next.js's brand colour is black, which disappears in dark mode.
                  color={sdk.iconColor === "#000000" ? undefined : sdk.iconColor}
                  className="size-3.5"
                />
                {sdk.name} guide
              </Link>
            ))}
          </div>
        </Step>

        <Step
          state="upcoming"
          number={3}
          title="Send your first request"
          description="Open your app, use the feedback button and submit a test idea. It shows up here, and this checklist turns into your dashboard."
        />
      </ol>
    </section>
  );
}

function Step({
  state,
  number,
  title,
  description,
  children,
}: {
  state: "done" | "current" | "upcoming";
  number?: number;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-4" aria-current={state === "current" ? "step" : undefined}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          state === "done" && "bg-primary text-primary-foreground",
          state === "current" && "ring-primary text-primary ring-2 ring-inset",
          state === "upcoming" && "ring-border text-muted-foreground ring-1 ring-inset",
        )}
      >
        {state === "done" ? <Check className="size-3.5" strokeWidth={3} aria-label="Done" /> : number}
      </span>
      <div className="min-w-0 flex-1 space-y-3 pt-0.5">
        <div className="space-y-1">
          <p
            className={cn(
              "font-medium",
              state === "done" && "text-muted-foreground line-through decoration-1",
              state === "upcoming" && "text-muted-foreground",
            )}
          >
            {title}
          </p>
          {description && (
            <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">{description}</p>
          )}
        </div>
        {children}
      </div>
    </li>
  );
}
