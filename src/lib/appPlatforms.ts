import { siApple, siAndroid } from "simple-icons";
import { Globe, type LucideIcon } from "lucide-react";
import type { AppPlatformId } from "@/types";

type PlatformIcon =
  | { kind: "brand"; path: string; color: string }
  | { kind: "lucide"; Icon: LucideIcon };

export interface AppPlatformDef {
  id: AppPlatformId;
  label: string;
  icon: PlatformIcon;
}

export const APP_PLATFORMS: AppPlatformDef[] = [
  { id: "ios", label: "iOS", icon: { kind: "brand", path: siApple.path, color: `#${siApple.hex}` } },
  {
    id: "android",
    label: "Android",
    icon: { kind: "brand", path: siAndroid.path, color: `#${siAndroid.hex}` },
  },
  { id: "web", label: "Web", icon: { kind: "lucide", Icon: Globe } },
];

export const APP_PLATFORM_MAP: Record<AppPlatformId, AppPlatformDef> = Object.fromEntries(
  APP_PLATFORMS.map((platform) => [platform.id, platform])
) as Record<AppPlatformId, AppPlatformDef>;
