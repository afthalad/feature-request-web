import "server-only";
import { Polar } from "@polar-sh/sdk";

const server = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server,
});

// Subscription statuses that keep paid access. past_due keeps it while Polar retries the card,
// the same grace Dodo's on_hold gave.
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

export function grantsPaidAccess(status: string | undefined | null): boolean {
  return status ? PAID_STATUSES.has(status) : false;
}
