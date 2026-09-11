"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CreditCard, TriangleAlert } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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

      if (!idToken) {
        throw new Error("Not signed in.");
      }

      const response = await fetch("/api/internal/billing/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message ?? "Failed to open billing portal.",
        );
      }

      window.location.href = data.portalUrl;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to open billing portal.",
      );

      setIsLoading(false);
    }
  }

  return (
    <Item variant="muted">
      <ItemMedia variant="icon">
        <CreditCard className="size-5" />
      </ItemMedia>

      <ItemContent>
        <div className="flex flex-wrap items-center gap-2">
          <ItemTitle>{PLAN_LABEL[plan]} plan</ItemTitle>

          {billingPeriod && (
            <Badge variant="secondary" className="text-[10px]">
              {billingPeriod === "monthly" ? "Monthly" : "Yearly"}
            </Badge>
          )}
        </div>

        <ItemDescription>
          {isPaid && subscriptionStatus === "active" && nextBillingDate
            ? `Renews ${new Date(nextBillingDate).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                },
              )}`
            : PLAN_BLURB[plan]}
        </ItemDescription>

        {isOnHold && (
          <div className="text-destructive mt-2 flex items-center gap-2 text-sm">
            <TriangleAlert className="size-4 shrink-0" />
            <span>
              Your last payment failed. Update your payment method to keep your
              plan active.
            </span>
          </div>
        )}
      </ItemContent>

      {plan === "free" ? (
        <Link
          href="/pricing"
          className={buttonVariants({ variant: "default" })}
        >
          Upgrade
        </Link>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleManageBilling}
          disabled={isLoading}
        >
          {isLoading ? "Opening..." : "Manage billing"}
        </Button>
      )}
    </Item>
  );
}
