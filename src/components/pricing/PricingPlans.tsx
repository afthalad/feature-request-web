"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { PlanCard } from "@/components/pricing/PlanCard";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "1 app",
  "50 feature requests per app",
  "Unlimited votes & comments",
  "100 notification emails/month",
];

const STARTER_FEATURES = [
  "3 apps",
  "200 feature requests per app",
  "Unlimited votes & comments",
  "500 notification emails/month",
];

const PRO_FEATURES = [
  "5 apps",
  "Unlimited feature requests per app",
  "2,000 notification emails/month",
  "No \"Powered by\" badge",
  "Custom SDK colours, CSV export, Slack/Discord alerts",
];

const PRICES = {
  starter: { monthly: "$5", yearly: "$50" },
  pro: { monthly: "$9", yearly: "$90" },
};

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

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-md border border-border p-1 text-sm">
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            className={cn(
              "rounded px-3 py-1 transition-colors",
              period === "monthly" ? "bg-muted font-medium" : "text-muted-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPeriod("yearly")}
            className={cn(
              "rounded px-3 py-1 transition-colors",
              period === "yearly" ? "bg-muted font-medium" : "text-muted-foreground"
            )}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3">
        <PlanCard
          name="Free"
          price="$0"
          period="forever"
          features={FREE_FEATURES}
          ctaLabel="Get started free"
          ctaHref="/login"
        />
        <PlanCard
          name="Starter"
          price={PRICES.starter[period]}
          period={period === "monthly" ? "/ month" : "/ year"}
          note={period === "yearly" ? "Two months free vs. monthly" : undefined}
          features={STARTER_FEATURES}
          ctaLabel={period === "monthly" ? "Upgrade monthly" : "Upgrade yearly"}
          ctaHref={null}
          onCtaClick={() => handleUpgrade("starter")}
          ctaLoading={loadingPlan === "starter"}
        />
        <PlanCard
          name="Pro"
          price={PRICES.pro[period]}
          period={period === "monthly" ? "/ month" : "/ year"}
          note={period === "yearly" ? "Two months free vs. monthly" : undefined}
          highlight
          highlightLabel="Recommended"
          features={PRO_FEATURES}
          ctaLabel={period === "monthly" ? "Upgrade monthly" : "Upgrade yearly"}
          ctaHref={null}
          onCtaClick={() => handleUpgrade("pro")}
          ctaLoading={loadingPlan === "pro"}
        />
      </div>
    </div>
  );
}
