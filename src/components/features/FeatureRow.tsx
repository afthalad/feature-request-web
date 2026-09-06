"use client";

import { useState } from "react";
import { ChevronUp, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusSelect } from "@/components/features/StatusSelect";
import { DashboardCommentsPanel } from "@/components/comments/DashboardCommentsPanel";
import type { Feature } from "@/types";

interface FeatureRowProps {
  appId: string;
  feature: Feature;
  onStatusChange: (status: Feature["status"]) => void;
  onCommentCountChange: (featureId: string, delta: number) => void;
}

export function FeatureRow({ appId, feature, onStatusChange, onCommentCountChange }: FeatureRowProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="bg-muted p-4 ring-0">
      <div className="flex items-center gap-4">
        <div className="flex w-12 shrink-0 flex-col items-center text-muted-foreground">
          <ChevronUp className="size-4" />
          <span className="text-sm font-medium text-foreground">{feature.upvoteCount}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{feature.title}</p>
          {feature.description && (
            <p className="text-muted-foreground text-sm">{feature.description}</p>
          )}
        </div>
        <StatusSelect
          appId={appId}
          featureId={feature.id}
          status={feature.status}
          followerCount={feature.followerCount}
          onStatusChange={onStatusChange}
        />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setShowComments((value) => !value)}
          className="text-muted-foreground flex items-center gap-1.5 text-xs hover:text-foreground"
        >
          <MessageSquare className="size-3.5" />
          {feature.commentCount} comment{feature.commentCount === 1 ? "" : "s"}
        </button>
        {feature.followerCount > 0 && (
          <span className="text-muted-foreground text-xs">
            {feature.followerCount} following
          </span>
        )}
      </div>
      {showComments && (
        <DashboardCommentsPanel
          appId={appId}
          featureId={feature.id}
          onCountChange={(delta) => onCommentCountChange(feature.id, delta)}
        />
      )}
    </Card>
  );
}
