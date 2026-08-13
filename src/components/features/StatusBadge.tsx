import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeatureStatus } from "@/types";

const STATUS_LABEL: Record<FeatureStatus, string> = {
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

const STATUS_CLASS: Record<FeatureStatus, string> = {
  open: "bg-secondary text-secondary-foreground",
  planned: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  done: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  declined: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: FeatureStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export { STATUS_LABEL };
