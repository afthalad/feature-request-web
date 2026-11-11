import { listAppPlatforms } from "@/lib/apps/appIds";
import { PLATFORMS } from "@/lib/platforms";
import { SetupState, type SetupGuide } from "@/components/apps/setup/SetupState";
import type { App, AppPlatformId } from "@/types";

/** The SDKs that fit each platform an app can be set up for. */
const SDKS_FOR: Record<AppPlatformId, string[]> = {
  ios: ["swiftui", "flutter"],
  android: ["kotlin", "flutter"],
  web: ["nextjs", "react", "laravel"],
};

function guidesFor(app: App): SetupGuide[] {
  const platforms = listAppPlatforms(app);
  const ids = platforms.length ? new Set(platforms.flatMap((p) => SDKS_FOR[p])) : null;
  return PLATFORMS.filter((sdk) => sdk.href && (!ids || ids.has(sdk.id))).map((sdk) => ({
    id: sdk.id,
    name: sdk.name,
    href: sdk.href!,
    iconPath: sdk.iconPath,
    // Next.js's brand colour is black, which disappears in dark mode.
    iconColor: sdk.iconColor === "#000000" ? undefined : sdk.iconColor,
  }));
}

/**
 * Shown in place of the stats until the first feature request arrives: the account has an app
 * but nothing is using it yet, so the useful thing to show is how to get that first piece of
 * feedback. `showSwitcher` adds a toggle between the candidate layouts.
 */
export function SetupChecklist({ app, showSwitcher = false }: { app: App; showSwitcher?: boolean }) {
  return (
    <SetupState
      app={{ id: app.id, name: app.name, emailsOwner: app.emailOnNewRequest !== false }}
      guides={guidesFor(app)}
      showSwitcher={showSwitcher}
    />
  );
}
