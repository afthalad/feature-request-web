"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Sparkles, Sprout } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { PlanCard } from "@/components/pricing/PlanCard";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "1 app",
  "50 visible feature requests per app",
  "Unlimited votes & comments",
  "Unlimited notification emails",
  "Public board link",
];

const STARTER_FEATURES = [
  "3 apps",
  "200 visible feature requests per app",
  "Everything else in Free, unlimited",
];

const PRO_FEATURES = [
  "5 apps",
  "Unlimited visible feature requests",
  "No \"Powered by\" badge",
  "Custom SDK colours",
  "Custom public board name",
  "CSV export",
  "Slack & Discord alerts",
];

// Keep in sync with the Dodo Payments products (amounts in dollars).
// Yearly is 20% off twelve months of monthly.
const PRICES = {
  starter: { monthly: 14.99, yearly: 143.9 },
  pro: { monthly: 29.99, yearly: 287.9 },
};
const YEARLY_SAVING = "Save 20%";

type Period = "monthly" | "yearly";
type PaidPlan = "starter" | "pro";

export function PricingPlans() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);

  async function handleUpgrade(plan: PaidPlan) {
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
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to start checkout.");

      window.location.href = data.checkoutUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout.");
      setLoadingPlan(null);
    }
  }

  const paidProps = (plan: PaidPlan) => {
    const monthly = PRICES[plan].monthly;
    const yearly = PRICES[plan].yearly;
    return period === "monthly"
      ? { price: monthly, period: "/ month", note: "Billed monthly. Cancel anytime." }
      : {
          price: yearly,
          period: "/ year",
          compareAt: monthly * 12,
          note: `$${(yearly / 12).toFixed(2)}/mo, billed yearly`,
        };
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-center">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="relative grid grid-cols-2 rounded-full border border-border bg-muted p-1 text-sm"
        >
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-card shadow-sm ring-1 ring-border transition-transform duration-300 ease-out",
              period === "yearly" && "translate-x-full"
            )}
          />
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={period === value}
              onClick={() => setPeriod(value)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-2 rounded-full px-5 py-2 font-medium transition-colors",
                period === value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value === "monthly" ? "Monthly" : "Yearly"}
              {value === "yearly" && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
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
