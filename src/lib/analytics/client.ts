import posthog from "posthog-js";
import type { AnalyticsEvent, AnalyticsProperties } from "./events";

/**
 * Browser-side tracking. PostHog is started in src/instrumentation-client.ts only when
 * NEXT_PUBLIC_POSTHOG_KEY is set, so every helper here is a no-op without it (local runs,
 * previews), and never throws: analytics must not break a click.
 */
function ready(): boolean {
  return typeof window !== "undefined" && posthog.__loaded;
}

export function track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  if (!ready()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Ignore: tracking is best-effort.
  }
}

/**
 * Ties this browser to the signed-in account, so the anonymous visits before sign-up and the
 * server-side events (sent with the Firebase uid) land on one person in PostHog.
 */
export function identifyUser(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): void {
  if (!ready()) return;
  try {
    if (posthog.get_distinct_id() === user.uid) return;
    posthog.identify(user.uid, {
      email: user.email ?? undefined,
      name: user.displayName ?? undefined,
    });
  } catch {
    // Ignore.
  }
}

/** Call on sign-out, so the next person on this browser isn't merged into the last one. */
export function resetAnalytics(): void {
  if (!ready()) return;
  try {
    posthog.reset();
  } catch {
    // Ignore.
  }
}
