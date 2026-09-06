import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export function PlatformGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PLATFORMS.map((platform) => {
        const body = (
          <div
            className={cn(
              "group h-full space-y-3 rounded-2xl border border-border bg-card p-6 shadow-soft transition-all",
              platform.href ? "hover:-translate-y-0.5 hover:border-primary/40" : "opacity-60"
            )}
          >
            <div className="flex items-center justify-between">
              <BrandIcon path={platform.iconPath} color={platform.iconColor} className="size-6" />
              {!platform.href && (
                <Badge variant="secondary" className="text-[10px]">
                  Coming soon
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{platform.name}</h2>
              <p className="text-muted-foreground text-sm">{platform.tagline}</p>
            </div>
            {platform.href && (
              <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
                View docs
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </div>
        );

        return platform.href ? (
          <Link key={platform.id} href={platform.href}>
            {body}
          </Link>
        ) : (
          <div key={platform.id} aria-disabled className="cursor-not-allowed">
            {body}
          </div>
        );
      })}
    </div>
  );
}
