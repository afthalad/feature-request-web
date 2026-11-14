import type { PostHog } from "posthog-js";
import { POSTHOG_REGION, type AnalyticsEvent, type AnalyticsProperties } from "./events";

/**
 * Browser-side tracking. PostHog (~120 KB) is not in the page bundle: it's
 * downloaded once the page is idle (see src/instrumentation-client.ts), or
 * straight away if something is tracked before that. Calls made before it has
 * loaded are queued, so no event is lost.
 *
 * Off unless NEXT_PUBLIC_POSTHOG_KEY is set, so set it only in Vercel's
 * Production environment to keep local runs and previews out of the numbers.
 * Every helper is a no-op without it and never throws: analytics must not
 * break a click.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

let posthog: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const queue: ((ph: PostHog) => void)[] = [];

function run(fn: (ph: PostHog) => void, ph: PostHog) {
  try {
    fn(ph);
  } catch {
    // Ignore: tracking is best-effort.
  }
}

/** Downloads and starts PostHog once. Safe to call many times. */
export function loadAnalytics(): Promise<PostHog | null> {
  if (!KEY || typeof window === "undefined") return Promise.resolve(null);
  loading ??= import("posthog-js")
    .then(({ default: ph }) => {
      ph.init(KEY, {
        // Sent through this site (see the /ingest rewrites in next.config.ts), so ad blockers
        // that block posthog.com don't hide visitors from the funnel.
        api_host: "/ingest",
        ui_host: `https://${POSTHOG_REGION}.posthog.com`,
        defaults: "2026-08-30",
        // Client-side navigations count as page views too.
        capture_pageview: "history_change",
        // Uncaught errors and unhandled promise rejections go to PostHog Error tracking, on the
        // same person as their funnel events.
        capture_exceptions: true,
      });
      posthog = ph;
      for (const fn of queue.splice(0)) run(fn, ph);
      return ph;
    })
    .catch(() => null);
  return loading;
}

function withPosthog(fn: (ph: PostHog) => void): void {
  if (!KEY || typeof window === "undefined") return;
  if (posthog) return run(fn, posthog);
  queue.push(fn);
  void loadAnalytics();
}

export function track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  withPosthog((ph) => ph.capture(event, properties));
}

/** Reports an error the UI caught (and showed a toast for) to PostHog Error tracking. */
export function captureError(error: unknown, properties?: AnalyticsProperties): void {
  withPosthog((ph) => ph.captureException(error, properties));
}

/**
 * Ties this browser to the signed-in account, so the anonymous visits before sign-up and the
 * server-side events (sent with the Firebase uid) land on one person in PostHog.
 */
export function identifyUser(user: { uid: string; email?: string | null; displayName?: string | null }): void {
  withPosthog((ph) => {
    if (ph.get_distinct_id() === user.uid) return;
    ph.identify(user.uid, {
      email: user.email ?? undefined,
      name: user.displayName ?? undefined,
    });
  });
}

/** Call on sign-out, so the next person on this browser isn't merged into the last one. */
export function resetAnalytics(): void {
  // Nothing to reset if PostHog never loaded on this page.
  if (posthog) run((ph) => ph.reset(), posthog);
}
