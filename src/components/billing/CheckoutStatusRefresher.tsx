"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import type { Plan } from "@/types";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 10;

export function CheckoutStatusRefresher({ plan }: { plan: Plan }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const attemptsRef = useRef(0);

  const isWaitingForCheckout = searchParams.get("checkout") === "success";
  // The plan just bought. A plan switch starts from a paid plan, so "not free" isn't enough.
  const expectedPlan = searchParams.get("plan");

  useEffect(() => {
    if (!isWaitingForCheckout) return;

    if (expectedPlan ? plan === expectedPlan : plan !== "free") {
      toast.success(`Your ${plan} plan is now active.`);
      router.replace(pathname);
      return;
    }

    if (attemptsRef.current >= MAX_ATTEMPTS) {
      toast.info("Payment received — this can take a minute to reflect. Refresh if it doesn't update.");
      router.replace(pathname);
      return;
    }

    const timer = setTimeout(() => {
      attemptsRef.current += 1;
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, isWaitingForCheckout, expectedPlan]);

  return null;
}
