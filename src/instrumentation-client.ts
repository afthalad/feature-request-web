import posthog from "posthog-js";
import { POSTHOG_REGION } from "@/lib/analytics/events";

// Product analytics (funnels, sign-ups, upgrades). Runs before the app hydrates.
// Off unless NEXT_PUBLIC_POSTHOG_KEY is set, so set it only in Vercel's Production environment
// to keep local runs and preview deploys out of the numbers (like GA in the root layout).
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    // Sent through this site (see the /ingest rewrites in next.config.ts), so ad blockers
    // that block posthog.com don't hide visitors from the funnel.
    api_host: "/ingest",
    ui_host: `https://${POSTHOG_REGION}.posthog.com`,
    defaults: "2026-08-30",
    // Client-side navigations count as page views too.
    capture_pageview: "history_change",
  });
}
