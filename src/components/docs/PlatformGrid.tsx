import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export function PlatformGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PLATFORMS.map((platform) => {
        const Icon = platform.icon;
        const body = (
          <div
            className={cn(
              "flex h-full flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
              platform.href ? "hover:border-primary/50 hover:bg-accent/40" : "opacity-60"
            )}
          >
            <Icon className="size-6" />
            <span className="text-sm font-medium">{platform.name}</span>
            {platform.href ? (
              <span className="text-primary inline-flex items-center gap-0.5 text-xs font-medium">
                View docs <ArrowRight className="size-3" />
              </span>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Coming soon
              </Badge>
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
