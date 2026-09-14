import { APP_PLATFORM_MAP } from "@/lib/appPlatforms";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { cn } from "@/lib/utils";
import type { AppPlatformId } from "@/types";

interface PlatformIconsProps {
  platforms: AppPlatformId[];
  className?: string;
}

export function PlatformIcons({ platforms, className }: PlatformIconsProps) {
  if (platforms.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {platforms.map((id) => {
        const platform = APP_PLATFORM_MAP[id];
        if (!platform) return null;
        return (
          <span
            key={id}
            title={platform.label}
            className="text-muted-foreground flex size-5 items-center justify-center"
          >
            {platform.icon.kind === "brand" ? (
              <BrandIcon path={platform.icon.path} color={platform.icon.color} className="size-3.5" />
            ) : (
              <platform.icon.Icon className="size-3.5" />
            )}
          </span>
        );
      })}
    </div>
  );
}
