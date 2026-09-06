"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CreditCard, TriangleAlert, ArrowUpRight } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

interface BillingSummaryProps {
  plan: Plan;
  subscriptionStatus?: string;
  billingPeriod?: "monthly" | "yearly" | null;
  nextBillingDate?: string | null;
}

const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

const PLAN_BLURB: Record<Plan, string> = {
  free: "1 app, 50 requests per app — upgrade for more room to grow.",
  starter: "3 apps, 200 requests per app, 500 emails a month.",
  pro: "5 apps, unlimited requests, no badge, full customisation.",
};

export function BillingSummary({
  plan,
  subscriptionStatus,
  billingPeriod,
  nextBillingDate,
}: BillingSummaryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isPaid = plan !== "free";
  const isOnHold = subscriptionStatus === "on_hold";

  async function handleManageBilling() {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch("/api/internal/billing/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to open billing portal.");

      window.location.href = data.portalUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open billing portal.");
      setIsLoading(false);
    }
  }

  return (
    <Card className="gap-0 p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg",
              isPaid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            <CreditCard className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{PLAN_LABEL[plan]} plan</span>
              {billingPeriod && (
                <Badge variant="secondary" className="text-[10px]">
                  {billingPeriod === "monthly" ? "Monthly" : "Yearly"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {isPaid && subscriptionStatus === "active" && nextBillingDate
                ? `Renews ${new Date(nextBillingDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`
                : PLAN_BLURB[plan]}
            </p>
          </div>
        </div>
        {plan === "free" ? (
          <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
            Upgrade
            <ArrowUpRight className="size-4" />
          </Link>
        ) : (
          <Button size="sm" variant="outline" onClick={handleManageBilling} disabled={isLoading}>
            {isLoading ? "Opening..." : "Manage billing"}
          </Button>
        )}
      </div>
      {isOnHold && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 border-t px-5 py-3 text-sm">
          <TriangleAlert className="size-4 shrink-0" />
          <span>Your last payment failed. Update your payment method to keep your plan active.</span>
        </div>
      )}
    </Card>
  );
}
