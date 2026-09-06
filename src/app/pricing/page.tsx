import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { PricingPlans } from "@/components/pricing/PricingPlans";

interface PlanRow {
  label: string;
  free: string | boolean;
  starter: string | boolean;
  pro: string | boolean;
}

const ROWS: PlanRow[] = [
  { label: "Apps", free: "1", starter: "3", pro: "5" },
  { label: "Feature requests per app", free: "50", starter: "200", pro: "Unlimited" },
  { label: "Votes", free: "Unlimited", starter: "Unlimited", pro: "Unlimited" },
  { label: "Comments", free: "Unlimited", starter: "Unlimited", pro: "Unlimited" },
  { label: "Notification emails", free: "100/month", starter: "500/month", pro: "2,000/month" },
  { label: '"Powered by" badge in the SDK', free: "Shown", starter: "Shown", pro: "Removed" },
  { label: "Custom colours in the SDK", free: false, starter: false, pro: true },
  { label: "Public board link", free: "Yes", starter: "Yes", pro: "Yes, custom name" },
  { label: "Export to CSV", free: false, starter: false, pro: true },
  { label: "Slack / Discord alerts", free: false, starter: false, pro: true },
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
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-12 px-4 py-12">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Pricing</h1>
          <p className="text-muted-foreground">
            Free forever for a hobby project. Upgrade once you&apos;re shipping.
          </p>
        </div>

        <PricingPlans />

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">Starter</TableHead>
                <TableHead className="text-center">Pro</TableHead>
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
                    <Cell value={row.starter} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Cell value={row.pro} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
