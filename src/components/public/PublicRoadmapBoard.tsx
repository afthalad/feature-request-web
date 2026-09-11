import { PublicFeatureRow } from "@/components/public/PublicFeatureRow";
import { formatDate } from "@/lib/date";
import type { FeatureStatus, FeatureWithVote } from "@/types";

interface PublicRoadmapBoardProps {
  slug: string;
  deviceId: string | null;
  features: FeatureWithVote[];
  onVote: (featureId: string, hasVoted: boolean) => void;
  onCommentCountChange: (featureId: string, delta: number) => void;
  onFollowChange: (featureId: string, isFollowing: boolean) => void;
}

const COLUMNS: { status: FeatureStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

export function PublicRoadmapBoard({
  slug,
  deviceId,
  features,
  onVote,
  onCommentCountChange,
  onFollowChange,
}: PublicRoadmapBoardProps) {
  const recentlyShipped = features
    .filter((f) => f.status === "done")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const hasRoadmapItems = COLUMNS.some(
    ({ status }) => features.filter((f) => f.status === status).length > 0
  );

  if (!hasRoadmapItems) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nothing on the roadmap yet.
      </p>
    );
  }

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
      <div className="space-y-6">
        {COLUMNS.map(({ status, label }) => {
          const columnFeatures = features.filter((f) => f.status === status);
          if (columnFeatures.length === 0) return null;
          return (
            <div key={status} className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-medium">{label}</h3>
              <div className="divide-y rounded-lg border">
                {columnFeatures.map((feature) => (
                  <PublicFeatureRow
                    key={feature.id}
                    slug={slug}
                    deviceId={deviceId}
                    feature={feature}
                    onVote={onVote}
                    onCommentCountChange={onCommentCountChange}
                    onFollowChange={onFollowChange}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
