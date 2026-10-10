import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  name: string;
  icon: LucideIcon;
  tagline: string;
  /** Amount in dollars, e.g. 14.99. */
  price: number;
  period: string;
  /** Small line under the price, e.g. "$11.99/mo, billed yearly". */
  note?: string;
  /** A struck-through comparison price, e.g. the monthly cost over a year. */
  compareAt?: number;
  highlight?: boolean;
  highlightLabel?: string;
  /** Heading above the feature list, e.g. "Everything in Free, plus". */
  featuresLead?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string | null;
  ctaDisabledLabel?: string;
  onCtaClick?: () => void;
  ctaLoading?: boolean;
}

function formatPrice(amount: number) {
  const [dollars, cents] = amount.toFixed(2).split(".");
  return { dollars, cents: cents === "00" ? null : cents };
}

export function PlanCard({
  name,
  icon: Icon,
  tagline,
  price,
  period,
  note,
  compareAt,
  highlight,
  highlightLabel = "Most popular",
  featuresLead,
  features,
  ctaLabel,
  ctaHref,
  ctaDisabledLabel,
  onCtaClick,
  ctaLoading,
}: PlanCardProps) {
  const { dollars, cents } = formatPrice(price);
  const ctaVariant = highlight ? "default" : "outline";
  const ctaClass = "h-11 w-full text-sm font-semibold";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-6 sm:p-7",
        highlight
          ? "border-primary/50 from-primary/[0.07] bg-gradient-to-b to-transparent to-45% shadow-lift ring-primary/20 ring-4"
          : "border-border",
      )}
    >
      {highlight && (
        <span className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-sm">
          {highlightLabel}
        </span>
      )}

      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">{name}</h3>
      </div>
      <p className="text-muted-foreground mt-3 min-h-10 text-sm leading-relaxed">
        {tagline}
      </p>

      <div className="mt-5 flex items-end gap-1.5">
        <p className="flex items-start leading-none font-bold tracking-tight">
          <span className="mt-1.5 text-2xl md:text-xl lg:text-2xl">$</span>
          <span className="text-3xl tabular-nums md:text-3xl lg:text-3xl">
            {dollars}
          </span>
          {cents && (
            <span className="text-3xl  md:text-xl lg:text-3xl">.{cents}</span>
          )}
        </p>
        <span className="text-muted-foreground pb-1 text-sm whitespace-nowrap">
          {period}
        </span>
      </div>
      <p className="text-muted-foreground mt-2 min-h-5 text-xs">
        {compareAt !== undefined && (
          <span className="mr-1.5 line-through">${compareAt.toFixed(2)}</span>
        )}
        {note}
      </p>

      <div className="mt-6">
        {onCtaClick ? (
          <Button
            type="button"
            onClick={onCtaClick}
            disabled={ctaLoading}
            variant={ctaVariant}
            className={ctaClass}
          >
            {ctaLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                {ctaLabel}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        ) : ctaHref ? (
          <Link
            href={ctaHref}
            className={buttonVariants({
              variant: ctaVariant,
              className: ctaClass,
            })}
          >
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <span
            className={buttonVariants({
              variant: "outline",
              className: cn(ctaClass, "pointer-events-none opacity-50"),
            })}
          >
            {ctaDisabledLabel ?? ctaLabel}
          </span>
        )}
      </div>

      <div className="mt-7 border-t border-border pt-6">
        {featuresLead && (
          <p className="text-muted-foreground mb-3.5 text-xs font-semibold tracking-wide uppercase">
            {featuresLead}
          </p>
        )}
        <ul className="space-y-3 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full",
                  highlight
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
