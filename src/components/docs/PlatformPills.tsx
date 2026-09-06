import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export function PlatformPills({ activeId }: { activeId?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PLATFORMS.map((platform) => {
        const isActive = platform.id === activeId;
        const pill = (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              isActive && "border-primary bg-primary/10 text-primary",
              !platform.href && "text-muted-foreground opacity-70"
            )}
          >
            <BrandIcon path={platform.iconPath} color={platform.iconColor} className="size-3.5" />
            {platform.name}
            {!platform.href && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                Soon
              </Badge>
            )}
          </span>
        );
        return platform.href && !isActive ? (
          <Link key={platform.id} href={platform.href}>
            {pill}
          </Link>
        ) : (
          <span key={platform.id} className={!platform.href ? "cursor-not-allowed" : undefined}>
            {pill}
          </span>
        );
      })}
    </div>
  );
}
