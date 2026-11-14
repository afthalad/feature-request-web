"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Sparkles, Sprout } from "lucide-react";
import { toast } from "sonner";
import { loadAuth } from "@/lib/firebase/lazy";
import { whenIdle } from "@/lib/idle";
import { PlanCard } from "@/components/pricing/PlanCard";
import { cn } from "@/lib/utils";
import { captureError, identifyUser, track } from "@/lib/analytics/client";

const FREE_FEATURES = [
  "1 app on one platform",
  "First 5 feature requests visible per app",
  "Collect unlimited requests, votes & comments",
  "Email for every new request (details for the first 5)",
  "Custom SDK colours",
];

const STARTER_FEATURES = [
  "3 apps on every platform",
  "First 200 feature requests visible per app",
  "Full email details for the first 200",
  'No "Powered by" badge',
];

const PRO_FEATURES = [
  "5 apps on every platform",
  "Every feature request visible",
  "Full email details for every request",
  "Public board with your own link",
  "CSV export",
];

// Keep in sync with the Polar products (amounts in dollars).
// Yearly is ten months of monthly (two months free).
const PRICES = {
  starter: { monthly: 9, yearly: 90 },
  pro: { monthly: 24, yearly: 240 },
};
const YEARLY_SAVING = "2 months free";

type Period = "monthly" | "yearly";
type PaidPlan = "starter" | "pro";

export function PricingPlans() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);

  useEffect(() => {
    // Firebase (to know if the visitor is signed in) loads once the page is idle.
    let cancelled = false;
    const cancelIdle = whenIdle(async () => {
      const auth = await loadAuth();
      await auth.authStateReady();
      if (cancelled) return;
      const user = auth.currentUser;
      if (user) identifyUser(user);
      track("pricing_viewed", { signed_in: Boolean(user) });
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  function changePeriod(value: Period) {
    if (value !== period) track("pricing_period_changed", { period: value });
    setPeriod(value);
  }

  async function handleUpgrade(plan: PaidPlan) {
    // Right after a page load Firebase is still restoring the signed-in user, and currentUser
    // is null until it has: without waiting, a quick click sent signed-in people to /login.
    const auth = await loadAuth();
    await auth.authStateReady();
    track("upgrade_clicked", {
      plan,
      period,
      source: "pricing_page",
      signed_in: Boolean(auth.currentUser),
    });
    if (!auth.currentUser) {
      router.push("/login");
      return;
    }

    setLoadingPlan(plan);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/internal/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ plan, period }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message ?? "We couldn't start checkout. Please try again.");

      window.location.href = data.checkoutUrl;
    } catch (error) {
      track("checkout_failed", { plan, period, source: "pricing_page" });
      captureError(error, { plan, period, source: "pricing_page" });
      toast.error(
        error instanceof Error ? error.message : "We couldn't start checkout. Please try again.",
      );
      setLoadingPlan(null);
    }
  }

  const paidProps = (plan: PaidPlan) => {
    const monthly = PRICES[plan].monthly;
    const yearly = PRICES[plan].yearly;
    return period === "monthly"
      ? {
          price: monthly,
          period: "/ month",
          note: "Billed monthly. Cancel anytime.",
        }
      : {
          price: yearly,
          period: "/ year",
          compareAt: monthly * 12,
          note: `$${Number.isInteger(yearly / 12) ? yearly / 12 : (yearly / 12).toFixed(2)}/mo, billed yearly`,
        };
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-center">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="relative grid grid-cols-2 rounded-full  bg-muted p-1 text-sm"
        >
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-card shadow-sm ring-1 ring-border transition-transform duration-300 ease-out",
              period === "yearly" && "translate-x-full",
            )}
          />
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={period === value}
              onClick={() => changePeriod(value)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-2 rounded-full px-5 py-2 font-medium transition-colors",
                period === value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "monthly" ? "Monthly" : "Yearly"}
              {value === "yearly" && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {YEARLY_SAVING}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-sm gap-6 text-left md:max-w-5xl md:grid-cols-3 md:gap-4 lg:gap-6">
        <PlanCard
          name="Free"
          icon={Sprout}
          tagline="For a side project or trying it out."
          price={0}
          period="forever"
          note="No credit card needed."
          features={FREE_FEATURES}
          ctaLabel="Get started free"
          ctaHref="/login"
        />
        <PlanCard
          name="Starter"
          icon={Rocket}
          tagline="For an indie app that's starting to get traction."
          {...paidProps("starter")}
          featuresLead="Everything in Free, plus"
          features={STARTER_FEATURES}
          ctaLabel="Upgrade to Starter"
          ctaHref={null}
          onCtaClick={() => handleUpgrade("starter")}
          ctaLoading={loadingPlan === "starter"}
        />
        <PlanCard
          name="Pro"
          icon={Sparkles}
          tagline="For developers shipping several apps."
          {...paidProps("pro")}
          highlight
          featuresLead="Everything in Starter, plus"
          features={PRO_FEATURES}
          ctaLabel="Upgrade to Pro"
          ctaHref={null}
          onCtaClick={() => handleUpgrade("pro")}
          ctaLoading={loadingPlan === "pro"}
        />
      </div>
    </div>
  );
}
