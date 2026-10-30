import "server-only";
import { Polar } from "@polar-sh/sdk";

const server = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server,
});

export const POLAR_API_BASE =
  server === "production" ? "https://api.polar.sh" : "https://sandbox-api.polar.sh";

// past_due keeps access while the failed payment is retried.
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

export function grantsPaidAccess(status: string | undefined | null): boolean {
  return status ? PAID_STATUSES.has(status) : false;
}
