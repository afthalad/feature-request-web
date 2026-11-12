import "server-only";
import { after } from "next/server";
import { PostHog } from "posthog-node";
import { POSTHOG_REGION, type AnalyticsEvent, type AnalyticsProperties } from "./events";

let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client === undefined) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    client = key
      ? new PostHog(key, { host: `https://${POSTHOG_REGION}.i.posthog.com`, flushAt: 1, flushInterval: 0 })
      : null;
  }
  return client;
}

/**
 * Sends an event from the server, for steps the browser can miss (ad blockers, closed tabs) or
 * never sees (webhooks, SDK calls). `distinctId` is the Firebase uid, the same id the browser
 * identifies with, so these join the person's browser events.
 *
 * Runs in after(): it never delays or fails the response, and Vercel keeps the function alive
 * until it is sent. Must be called while handling a request.
 */
export function trackServer(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  if (!getClient()) return;
  after(() => sendServerEvent(distinctId, event, properties));
}

/** Sends now and resolves when done. For code already running inside after(). Never throws. */
export async function sendServerEvent(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): Promise<void> {
  const posthog = getClient();
  if (!posthog) return;
  await posthog
    .captureImmediate({ distinctId, event, properties })
    .catch((error) => console.error(`[analytics] failed to send ${event}`, error));
}
