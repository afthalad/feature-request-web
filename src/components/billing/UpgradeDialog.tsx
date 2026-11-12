"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { captureError, track } from "@/lib/analytics/client";
import type { UpgradeReason } from "@/lib/analytics/events";

type PaidPlan = "starter" | "pro";

const PLAN_OPTIONS: {
  plan: PaidPlan;
  name: string;
  price: string;
  blurb: string;
  highlight?: boolean;
}[] = [
  { plan: "starter", name: "Starter", price: "$9/mo", blurb: "3 apps, 200 requests/app" },
  {
    plan: "pro",
    name: "Pro",
    price: "$24/mo",
    blurb: "5 apps, unlimited requests",
    highlight: true,
  },
];

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  /** Which limit opened this dialog, for the upgrade funnel in analytics. */
  reason: UpgradeReason;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  title = "Upgrade to keep going",
  description,
  reason,
}: UpgradeDialogProps) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);

  useEffect(() => {
    if (open) track("upgrade_prompt_shown", { reason, surface: "dialog" });
  }, [open, reason]);

  async function handleUpgrade(plan: PaidPlan) {
    // Right after a page load Firebase is still restoring the signed-in user, and currentUser
    // is null until it has: without waiting, a quick click sent signed-in people to /login.
    await auth.authStateReady();
    track("upgrade_clicked", { plan, period: "monthly", source: "upgrade_dialog", reason });
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
        body: JSON.stringify({ plan, period: "monthly" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "We couldn't start checkout. Please try again.");

      window.location.href = data.checkoutUrl;
    } catch (error) {
      track("checkout_failed", { plan, period: "monthly", source: "upgrade_dialog", reason });
      captureError(error, { plan, period: "monthly", source: "upgrade_dialog", reason });
      toast.error(error instanceof Error ? error.message : "We couldn't start checkout. Please try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {PLAN_OPTIONS.map(({ plan, name, price, blurb, highlight }) => (
            <div
              key={plan}
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-4",
                highlight && "border-primary"
              )}
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xl font-semibold tracking-tight">{price}</p>
                <p className="text-muted-foreground text-xs">{blurb}</p>
              </div>
              <Button
                type="button"
                variant={highlight ? "default" : "outline"}
                disabled={loadingPlan !== null}
                onClick={() => handleUpgrade(plan)}
                className="w-full"
              >
                {loadingPlan === plan ? "Redirecting..." : "Upgrade"}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Link
            href="/pricing"
            className={cn(buttonVariants({ variant: "ghost" }), "sm:mr-auto")}
          >
            Compare all plans
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
