import "server-only";
import DodoPayments from "dodopayments";

const environment = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
});
