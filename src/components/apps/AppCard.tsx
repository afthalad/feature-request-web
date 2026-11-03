import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { APP_PLATFORM_MAP } from "@/lib/appPlatforms";
import { listAppPlatforms } from "@/lib/apps/appIds";
import type { App } from "@/types";

export function AppCard({ app }: { app: App }) {
  const platforms = listAppPlatforms(app);

  return (
    <Link
      href={`/dashboard/apps/${app.id}`}
      className="bg-surface hover:bg-surface-hover group flex items-center gap-4 rounded-xl p-4 transition-colors"
    >
      <div className="bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg text-lg font-semibold">
        {app.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium">{app.name}</p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
          {platforms.map((id) => {
            const { label, icon } = APP_PLATFORM_MAP[id];
            return (
              <span key={id} className="inline-flex items-center gap-1">
                {icon.kind === "brand" ? (
                  <BrandIcon path={icon.path} color={icon.color} className="size-3" />
                ) : (
                  <icon.Icon className="size-3" />
                )}
                {label}
              </span>
            );
          })}
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold leading-none">{app.featureCount}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          request{app.featureCount === 1 ? "" : "s"}
        </p>
      </div>
      <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
    </Link>
  );
}
