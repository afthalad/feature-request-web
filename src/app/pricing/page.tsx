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
import { cn } from "@/lib/utils";

interface PlanRow {
  label: string;
  free: string | boolean;
  starter: string | boolean;
  pro: string | boolean;
}

const ROWS: PlanRow[] = [
  { label: "Apps", free: "1", starter: "3", pro: "5" },
  {
    label: "Visible feature requests per app",
    free: "50",
    starter: "200",
    pro: "Unlimited",
  },
  { label: "Votes", free: "Unlimited", starter: "Unlimited", pro: "Unlimited" },
  {
    label: "Comments",
    free: "Unlimited",
    starter: "Unlimited",
    pro: "Unlimited",
  },
  {
    label: "Notification emails",
    free: "Unlimited",
    starter: "Unlimited",
    pro: "Unlimited",
  },
  {
    label: '"Powered by" badge in the SDK',
    free: "Shown",
    starter: "Shown",
    pro: "Removed",
  },
  {
    label: "Custom colours in the SDK",
    free: false,
    starter: false,
    pro: true,
  },
  {
    label: "Public board link",
    free: "Yes",
    starter: "Yes",
    pro: "Yes, custom name",
  },
  { label: "Export to CSV", free: false, starter: false, pro: true },
  { label: "Slack / Discord alerts", free: false, starter: false, pro: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto size-4 text-emerald-500 dark:text-emerald-400" />
    ) : (
      <X className="mx-auto size-4 text-rose-500 dark:text-rose-400" />
    );
  }
  return <span>{value}</span>;
}

const PLAN_COLUMNS = ["free", "starter", "pro"] as const;

export default function PricingPage() {
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-14 px-4 py-14 sm:px-5 sm:py-20">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            Pricing
          </span>
          <h1 className="text-3xl font-bold text-balance sm:text-5xl">
            Start free. Upgrade when you&apos;re shipping.
          </h1>
          <p className="text-muted-foreground text-balance sm:text-lg">
            Free forever for a hobby project. Every plan includes unlimited votes,
            comments and notification emails.
          </p>
        </div>

        <PricingPlans />

        <div className="space-y-5">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Compare plans</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Table className="table-fixed text-xs sm:text-sm">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[34%] px-3 py-3 sm:w-[40%] sm:px-5">Feature</TableHead>
                  {PLAN_COLUMNS.map((plan) => (
                    <TableHead
                      key={plan}
                      className={cn(
                        "px-1.5 py-3 text-center font-semibold capitalize sm:px-3",
                        plan === "pro" && "text-primary"
                      )}
                    >
                      {plan}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {ROWS.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="px-3 py-3.5 font-medium whitespace-normal sm:px-5 sm:py-4">
                      {row.label}
                    </TableCell>
                    {PLAN_COLUMNS.map((plan) => (
                      <TableCell
                        key={plan}
                        className={cn(
                          "px-1.5 py-3.5 text-center whitespace-normal sm:px-3 sm:py-4",
                          plan === "pro" && "bg-primary/[0.04]"
                        )}
                      >
                        <Cell value={row[plan]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
