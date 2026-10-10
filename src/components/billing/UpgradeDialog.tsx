"use client";

import { useState } from "react";
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

type PaidPlan = "starter" | "pro";

const PLAN_OPTIONS: {
  plan: PaidPlan;
  name: string;
  price: string;
  blurb: string;
  highlight?: boolean;
}[] = [
  { plan: "starter", name: "Starter", price: "$14.99/mo", blurb: "3 apps, 200 requests/app" },
  {
    plan: "pro",
    name: "Pro",
    price: "$29.99/mo",
    blurb: "5 apps, unlimited requests",
    highlight: true,
  },
];

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  title = "Upgrade to keep going",
  description,
}: UpgradeDialogProps) {
  const router = useRouter();
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
        body: JSON.stringify({ plan, period: "monthly" }),
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
