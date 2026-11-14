import { loadAnalytics } from "@/lib/analytics/client";
import { whenIdle } from "@/lib/idle";

// Product analytics (funnels, sign-ups, upgrades). PostHog is downloaded once the page has
// loaded and the browser is idle, so it doesn't slow the first paint or the first tap.
// See src/lib/analytics/client.ts for when it is on.
whenIdle(() => void loadAnalytics());
