/**
 * Every product-analytics event, in one place, so names stay consistent between the browser and
 * the server and PostHog insights don't split one step across two spellings.
 *
 * The sales funnel, in order:
 *   $pageview → sign_in_clicked → signed_up → app_create_started → app_created → sdk_connected
 *   → first_feature_request_received → upgrade_prompt_shown → upgrade_clicked → checkout_started
 *   → subscription_purchased
 */
export type AnalyticsEvent =
  // Acquisition (browser)
  | "pricing_viewed"
  | "pricing_period_changed" // switched the monthly/yearly toggle
  | "sign_in_clicked"
  // Acquisition (server): only the first sign-in of a new account
  | "signed_up"
  | "welcome_email_sent"
  // Activation
  | "app_create_started" // browser: opened the new-app form
  | "app_create_blocked" // browser: hit the plan's app or platform limit while creating
  | "app_created" // server
  | "api_key_copied" // browser
  | "sdk_connected" // server: first SDK request for an app
  | "first_feature_request_received" // server: an app's first end-user request
  // Upgrade intent (browser)
  | "upgrade_prompt_shown" // an upgrade dialog or banner was shown, with `reason`
  | "upgrade_banner_clicked"
  | "upgrade_clicked" // picked a paid plan, with `plan`, `period`, `source`
  | "checkout_failed"
  // Revenue (server, from the checkout route and Polar webhooks)
  | "checkout_started"
  | "plan_switched"
  | "subscription_purchased"
  | "subscription_renewed"
  | "subscription_canceled"
  | "subscription_uncanceled"
  | "subscription_payment_failed"
  | "subscription_ended";

/** Why an upgrade prompt appeared. Compare these to see which limit sells the most upgrades. */
export type UpgradeReason =
  | "app_limit"
  | "platform_limit"
  | "csv_export"
  | "locked_requests"
  | "dashboard_banner";

export type AnalyticsProperties = Record<string, unknown>;

/** PostHog region. "us" unless NEXT_PUBLIC_POSTHOG_REGION is "eu". */
export const POSTHOG_REGION = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";
