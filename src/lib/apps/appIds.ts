import type { App, AppPlatformId } from "@/types";

export type AppIds = Pick<App, "iosBundleId" | "androidPackageName" | "webDomain">;

export const APP_ID_FIELDS: (keyof AppIds)[] = ["iosBundleId", "androidPackageName", "webDomain"];

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

const SDK_PLATFORMS: Record<string, AppPlatformId> = {
  swift: "ios",
  kotlin: "android",
  react: "web",
  next: "web",
  laravel: "web",
};

export function readAppIds(data: Partial<AppIds> | undefined): AppIds {
  return {
    iosBundleId: data?.iosBundleId ?? null,
    androidPackageName: data?.androidPackageName ?? null,
    webDomain: data?.webDomain ?? null,
  };
}

export function hasAppId(appIds: Partial<AppIds>): boolean {
  return Boolean(appIds.iosBundleId || appIds.androidPackageName || appIds.webDomain);
}

export function listAppIds(appIds: AppIds): string[] {
  return [appIds.iosBundleId, appIds.androidPackageName, appIds.webDomain].filter(
    (id): id is string => Boolean(id)
  );
}

export function isAppPlatformId(value: string | null): value is AppPlatformId {
  return value === "ios" || value === "android" || value === "web";
}

export function listAppPlatforms(appIds: AppIds): AppPlatformId[] {
  const platforms: AppPlatformId[] = [];
  if (appIds.iosBundleId) platforms.push("ios");
  if (appIds.androidPackageName) platforms.push("android");
  if (appIds.webDomain) platforms.push("web");
  return platforms;
}

export function getCallerId(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (origin && origin !== "null") {
    try {
      return new URL(origin).hostname.toLowerCase();
    } catch {
      return origin.toLowerCase();
    }
  }
  return req.headers.get("x-fewchurs-app-id")?.trim().toLowerCase() || null;
}

export function getCallerPlatform(req: Request, appIds: AppIds): AppPlatformId | null {
  const sdk = req.headers.get("x-fewchurs-sdk")?.toLowerCase() ?? "";
  const sdkPlatform = sdk.match(/\((ios|android|web)\)/)?.[1] as AppPlatformId | undefined;
  if (sdkPlatform) return sdkPlatform;

  const sdkName = sdk.split("/")[0];
  if (SDK_PLATFORMS[sdkName]) return SDK_PLATFORMS[sdkName];

  const origin = req.headers.get("origin");
  if (origin && origin !== "null") return "web";

  const callerId = getCallerId(req);
  if (!callerId) return null;
  const isIos = isSameOrChildId(callerId, appIds.iosBundleId);
  const isAndroid = isSameOrChildId(callerId, appIds.androidPackageName);
  if (isIos === isAndroid) return null;
  return isIos ? "ios" : "android";
}

/**
 * SDK versions that always send an app ID. A request from one of these with no ID was changed
 * by hand, so it is refused once the app has IDs saved. Other callers may still leave it off.
 */
const SDKS_ALWAYS_SENDING_ID: Record<string, string> = {
  laravel: "1.8.0",
};

export function sdkAlwaysSendsAppId(req: Request): boolean {
  const sdk = req.headers.get("x-fewchurs-sdk")?.trim().toLowerCase() ?? "";
  const [name, version] = sdk.split(/[\s/]/, 2);
  const minVersion = SDKS_ALWAYS_SENDING_ID[name];
  return Boolean(minVersion && version && compareVersions(version, minVersion) >= 0);
}

/**
 * When the caller's platform is known, only the ID saved for that platform counts, so a web
 * domain can't pass because it happens to start with the iOS Bundle ID.
 */
export function isCallerAllowed(
  callerId: string | null,
  appIds: AppIds,
  options: { platform?: AppPlatformId | null; requireId?: boolean } = {}
): boolean {
  if (!hasAppId(appIds)) return true;
  if (!callerId) return !options.requireId;
  if (LOCAL_HOSTS.includes(callerId)) return true;

  const { iosBundleId, androidPackageName, webDomain } = appIds;
  switch (options.platform) {
    case "ios":
      return isSameOrChildId(callerId, iosBundleId);
    case "android":
      return isSameOrChildId(callerId, androidPackageName);
    case "web":
      return isSameOrSubdomain(callerId, webDomain);
    default:
      return (
        isSameOrChildId(callerId, iosBundleId) ||
        isSameOrChildId(callerId, androidPackageName) ||
        isSameOrSubdomain(callerId, webDomain)
      );
  }
}

function isSameOrChildId(callerId: string, appId: string | null): boolean {
  if (!appId) return false;
  const id = appId.toLowerCase();
  return callerId === id || callerId.startsWith(`${id}.`);
}

function isSameOrSubdomain(callerId: string, domain: string | null): boolean {
  if (!domain) return false;
  return callerId === domain || callerId.endsWith(`.${domain}`);
}

/** Compares dotted version numbers like 1.10.0 and 1.8.0. Pre-release tags are ignored. */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = b.split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
