"use client";

import { useState } from "react";
import { FeatureRow } from "@/components/features/FeatureRow";
import type { FeatureStatus, RecentFeature } from "@/types";

export function RecentPendingFeatures({ features: initialFeatures }: { features: RecentFeature[] }) {
  const [features, setFeatures] = useState(initialFeatures);

  if (features.length === 0) return null;

  function handleStatusChange(featureId: string, status: FeatureStatus) {
    setFeatures((prev) =>
      status === "open"
        ? prev.map((f) => (f.id === featureId ? { ...f, status } : f))
        : prev.filter((f) => f.id !== featureId)
    );
  }

  function handleCommentCountChange(featureId: string, delta: number) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, commentCount: f.commentCount + delta } : f))
    );
  }

  function handleDelete(featureId: string) {
    setFeatures((prev) => prev.filter((f) => f.id !== featureId));
  }

  return (
    <div className="space-y-3">
      <h2 className="text-muted-foreground text-sm font-medium">Recent pending requests</h2>
      <div className="divide-y rounded-lg border">
        {features.map((feature) => (
          <FeatureRow
            key={feature.id}
            appId={feature.appId}
            appName={feature.appName}
            feature={feature}
            isNew={feature.isNew}
            onStatusChange={(status) => handleStatusChange(feature.id, status)}
            onCommentCountChange={handleCommentCountChange}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
