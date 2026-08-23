import Link from "next/link";
import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { MarketingHeader } from "@/components/layout/MarketingHeader";

interface PlanRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

const ROWS: PlanRow[] = [
  { label: "Apps", free: "1", pro: "5" },
  { label: "Feature requests per app", free: "50", pro: "Unlimited" },
  { label: "Votes", free: "Unlimited", pro: "Unlimited" },
  { label: "Comments", free: "Unlimited", pro: "Unlimited" },
  { label: "Notification emails", free: "100/month", pro: "2,000/month" },
  { label: '"Powered by" badge in the SDK', free: "Shown", pro: "Removed" },
  { label: "Custom colours in the SDK", free: false, pro: true },
  { label: "Public board link", free: "Yes", pro: "Yes, custom name" },
  { label: "Export to CSV", free: false, pro: true },
  { label: "Slack / Discord alerts", free: false, pro: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="size-4 text-foreground" />
    ) : (
      <X className="text-muted-foreground size-4" />
    );
  }
  return <span>{value}</span>;
}

export default function PricingPage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <>
      <MarketingHeader />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Pricing</h1>
        <p className="text-muted-foreground">
          Free forever for a hobby project. $9/month once you&apos;re shipping.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead className="text-center">Free</TableHead>
              <TableHead className="text-center">Pro — $9/month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="text-muted-foreground whitespace-normal">
                  {row.label}
                </TableCell>
                <TableCell className="text-center">
                  <Cell value={row.free} />
                </TableCell>
                <TableCell className="text-center">
                  <Cell value={row.pro} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 text-center">
        <p className="text-muted-foreground text-sm">
          Yearly: <span className="text-foreground font-medium">$90</span> — two months free.
        </p>
        {paymentLink ? (
          <Link href={paymentLink} className={buttonVariants({ className: "w-full sm:w-auto" })}>
            Upgrade to Pro
          </Link>
        ) : (
          <p className="text-muted-foreground text-xs">
            Upgrades aren&apos;t open yet — check back soon.
          </p>
        )}
      </div>
      </div>
    </>
  );
}
