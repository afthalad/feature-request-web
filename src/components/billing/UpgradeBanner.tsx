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
  title?: string;
}

export function UpgradeBanner({ message, title = "You're on the Free plan" }: UpgradeBannerProps) {
  return (
    <Item variant="muted" className=" bg-primary/5">
      <ItemMedia variant="icon">
        <Sparkles className="size-5 text-primary" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
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
