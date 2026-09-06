import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  note?: string;
  highlight?: boolean;
  highlightLabel?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string | null;
  ctaDisabledLabel?: string;
  onCtaClick?: () => void;
  ctaLoading?: boolean;
}

export function PlanCard({
  name,
  price,
  period,
  note,
  highlight,
  highlightLabel = "Best value",
  features,
  ctaLabel,
  ctaHref,
  ctaDisabledLabel,
  onCtaClick,
  ctaLoading,
}: PlanCardProps) {
  return (
    <Card className={cn("flex flex-col gap-5 p-6", highlight && "border-primary")}>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{name}</p>
          {highlight && (
            <Badge className="bg-primary text-primary-foreground shrink-0">
              {highlightLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight">{price}</span>
          <span className="text-muted-foreground text-sm">{period}</span>
        </div>
        {note && <p className="text-muted-foreground text-xs">{note}</p>}
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="text-primary mt-0.5 size-4 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {onCtaClick ? (
        <Button
          type="button"
          onClick={onCtaClick}
          disabled={ctaLoading}
          variant={highlight ? "default" : "outline"}
          className="w-full"
        >
          {ctaLoading ? "Redirecting..." : ctaLabel}
        </Button>
      ) : ctaHref ? (
        <Link
          href={ctaHref}
          className={buttonVariants({
            variant: highlight ? "default" : "outline",
            className: "w-full",
          })}
        >
          {ctaLabel}
        </Link>
      ) : (
        <span
          className={buttonVariants({
            variant: "outline",
            className: "w-full pointer-events-none opacity-50",
          })}
        >
          {ctaDisabledLabel ?? ctaLabel}
        </span>
      )}
    </Card>
  );
}
