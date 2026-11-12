"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { track } from "@/lib/analytics/client";
import type { UpgradeReason } from "@/lib/analytics/events";

interface UpgradeBannerProps {
  message: string;
  title?: string;
  /** Why the banner is showing, for the upgrade funnel in analytics. */
  reason: UpgradeReason;
}

export function UpgradeBanner({
  message,
  title = "You're on the Free plan",
  reason,
}: UpgradeBannerProps) {
  useEffect(() => {
    track("upgrade_prompt_shown", { reason, surface: "banner" });
  }, [reason]);

  return (
    <Item variant="muted" className=" bg-primary/5">
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{message}</ItemDescription>
      </ItemContent>
      <Link
        href="/pricing"
        onClick={() => track("upgrade_banner_clicked", { reason })}
        className={buttonVariants({ variant: "default", size: "sm" })}
      >
        Upgrade
      </Link>
    </Item>
  );
}
