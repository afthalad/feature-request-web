import { ChevronUp, Inbox, LayoutGrid } from "lucide-react";
import type { DashboardStats } from "@/types";

const STATS: { key: keyof DashboardStats; label: string; icon: typeof LayoutGrid }[] = [
  { key: "totalApps", label: "Apps", icon: LayoutGrid },
  { key: "totalFeatures", label: "Features", icon: Inbox },
  { key: "totalUpvotes", label: "Upvotes", icon: ChevronUp },
];

export function DashboardStatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STATS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="text-2xl font-semibold">{stats[key]}</p>
          </div>
          <div className="bg-foreground text-background flex size-10 shrink-0 items-center justify-center rounded-full">
            <Icon className="size-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
