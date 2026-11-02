import type { App, AppPlatformId } from "@/types";

export type AppIds = Pick<App, "iosBundleId" | "androidPackageName" | "webDomain">;

export const APP_ID_FIELDS: (keyof AppIds)[] = ["iosBundleId", "androidPackageName", "webDomain"];

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

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

export function isCallerAllowed(callerId: string | null, appIds: AppIds): boolean {
  if (!hasAppId(appIds)) return true;
  if (!callerId || LOCAL_HOSTS.includes(callerId)) return true;

  const { iosBundleId, androidPackageName, webDomain } = appIds;
  return (
    isSameOrChildId(callerId, iosBundleId) ||
    isSameOrChildId(callerId, androidPackageName) ||
    isSameOrSubdomain(callerId, webDomain)
  );
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
