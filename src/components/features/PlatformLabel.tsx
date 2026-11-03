import { BrandIcon } from "@/components/marketing/BrandIcon";
import { APP_PLATFORM_MAP } from "@/lib/appPlatforms";
import type { AppPlatformId } from "@/types";

export function PlatformLabel({ platform }: { platform: AppPlatformId }) {
  const { label, icon } = APP_PLATFORM_MAP[platform];
  return (
    <span
      title={`Requested from ${label}`}
      className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
    >
      {icon.kind === "brand" ? (
        <BrandIcon path={icon.path} className="size-3.5" />
      ) : (
        <icon.Icon className="size-3.5" />
      )}
      From {label}
    </span>
  );
}
