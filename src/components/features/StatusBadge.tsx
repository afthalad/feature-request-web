import { cn } from "@/lib/utils";
import type { FeatureStatus } from "@/types";

const STATUS_LABEL: Record<FeatureStatus, string> = {
  open: "Pending",
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

const STATUS_DOT_CLASS: Record<FeatureStatus, string> = {
  open: "bg-muted-foreground",
  planned: "bg-blue-500",
  in_progress: "bg-amber-500",
  done: "bg-emerald-500",
  declined: "bg-destructive",
};

export function StatusBadge({ status }: { status: FeatureStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export { STATUS_LABEL, STATUS_DOT_CLASS };
