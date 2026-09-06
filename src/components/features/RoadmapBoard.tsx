import { FeatureRow } from "@/components/features/FeatureRow";
import { formatDate } from "@/lib/date";
import type { Feature, FeatureStatus } from "@/types";

interface RoadmapBoardProps {
  appId: string;
  features: Feature[];
  onStatusChange: (featureId: string, status: FeatureStatus) => void;
  onCommentCountChange: (featureId: string, delta: number) => void;
}

const COLUMNS: { status: FeatureStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

export function RoadmapBoard({
  appId,
  features,
  onStatusChange,
  onCommentCountChange,
}: RoadmapBoardProps) {
  const recentlyShipped = features
    .filter((f) => f.status === "done")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {recentlyShipped.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-medium">Recently shipped</h2>
          <div className="flex flex-wrap gap-2">
            {recentlyShipped.map((feature) => (
              <div key={feature.id} className="rounded-md border px-3 py-1.5 text-xs">
                <span className="font-medium">{feature.title}</span>
                <span className="text-muted-foreground"> · {formatDate(feature.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map(({ status, label }) => {
          const columnFeatures = features.filter((f) => f.status === status);
          return (
            <div key={status} className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-medium">{label}</h3>
              <div className="space-y-3">
                {columnFeatures.length === 0 ? (
                  <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-xs">
                    Nothing here yet.
                  </div>
                ) : (
                  columnFeatures.map((feature) => (
                    <FeatureRow
                      key={feature.id}
                      appId={appId}
                      feature={feature}
                      onStatusChange={(newStatus) => onStatusChange(feature.id, newStatus)}
                      onCommentCountChange={onCommentCountChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
