import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

interface UpgradeBannerProps {
  message: string;
}

export function UpgradeBanner({ message }: UpgradeBannerProps) {
  return (
    <Item variant="muted" className=" bg-primary/5">
      <ItemMedia variant="icon">
        <Sparkles className="size-5 text-primary" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>You&apos;re on the Free plan</ItemTitle>
        <ItemDescription>{message}</ItemDescription>
      </ItemContent>
      <Link
        href="/pricing"
        className={buttonVariants({ variant: "default", size: "sm" })}
      >
        Upgrade
      </Link>
    </Item>
  );
}
