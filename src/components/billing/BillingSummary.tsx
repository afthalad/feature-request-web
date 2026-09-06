"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function BillingSummary({
  plan,
  subscriptionStatus,
  billingPeriod,
  nextBillingDate,
}: BillingSummaryProps) {
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{PLAN_LABEL[plan]} plan</span>
        {billingPeriod && (
          <Badge variant="secondary" className="text-[10px]">
            {billingPeriod === "monthly" ? "Monthly" : "Yearly"}
          </Badge>
        )}
        {subscriptionStatus === "on_hold" && (
          <Badge variant="destructive" className="text-[10px]">
            Payment failed
          </Badge>
        )}
        {plan !== "free" && subscriptionStatus === "active" && nextBillingDate && (
          <span className="text-muted-foreground text-xs">
            Renews {new Date(nextBillingDate).toLocaleDateString()}
          </span>
        )}
      </div>
      {plan === "free" ? (
        <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
          Upgrade
        </Link>
      ) : (
        <Button size="sm" variant="outline" onClick={handleManageBilling} disabled={isLoading}>
          {isLoading ? "Opening..." : "Manage billing"}
        </Button>
      )}
    </div>
  );
}
