import { ChevronUp } from "lucide-react";
import { StatusBadge } from "@/components/features/StatusBadge";
import type { FeatureStatus } from "@/types";

const SAMPLE_ROWS: { title: string; votes: number; status: FeatureStatus }[] = [
  { title: "Add dark mode", votes: 8, status: "planned" },
  { title: "Sync with calendar", votes: 4, status: "open" },
  { title: "Export to CSV", votes: 2, status: "done" },
];

export function PhoneMockup() {
  return (
    <div className="mx-auto w-[260px] rounded-[2.5rem] border-8 border-foreground/90 bg-background p-2 shadow-sm">
      <div className="h-5 w-full">
        <div className="mx-auto h-4 w-24 rounded-b-xl bg-foreground/90" />
      </div>
      <div className="space-y-2 rounded-[1.5rem] bg-muted/40 p-3">
        <p className="px-1 text-xs font-medium text-muted-foreground">Feature requests</p>
        {SAMPLE_ROWS.map((row) => (
          <div
            key={row.title}
            className="flex items-center gap-2 rounded-lg border bg-background p-2"
          >
            <div className="text-primary flex w-8 shrink-0 flex-col items-center">
              <ChevronUp className="size-3" />
              <span className="text-xs font-medium">{row.votes}</span>
            </div>
            <p className="min-w-0 flex-1 truncate text-xs font-medium">{row.title}</p>
            <StatusBadge status={row.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
