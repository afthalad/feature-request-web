import "server-only";

export type PaidPlan = "starter" | "pro";
export type BillingPeriod = "monthly" | "yearly";

const PRODUCT_IDS: Record<PaidPlan, Record<BillingPeriod, string | undefined>> = {
  starter: {
    monthly: process.env.DODO_PRODUCT_STARTER_MONTHLY,
    yearly: process.env.DODO_PRODUCT_STARTER_YEARLY,
  },
  pro: {
    monthly: process.env.DODO_PRODUCT_PRO_MONTHLY,
    yearly: process.env.DODO_PRODUCT_PRO_YEARLY,
  },
};

const PLAN_BY_PRODUCT_ID: Record<string, { plan: PaidPlan; period: BillingPeriod }> = {};
for (const plan of Object.keys(PRODUCT_IDS) as PaidPlan[]) {
  for (const period of Object.keys(PRODUCT_IDS[plan]) as BillingPeriod[]) {
    const productId = PRODUCT_IDS[plan][period];
    if (productId) PLAN_BY_PRODUCT_ID[productId] = { plan, period };
  }
}

export function productIdFor(plan: PaidPlan, period: BillingPeriod): string | null {
  return PRODUCT_IDS[plan][period] ?? null;
}

export function planFromProductId(productId: string): { plan: PaidPlan; period: BillingPeriod } | null {
  return PLAN_BY_PRODUCT_ID[productId] ?? null;
}
