"use client";

import { useState } from "react";
import { ChevronUp, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/features/StatusBadge";
import { PublicCommentsPanel } from "@/components/comments/PublicCommentsPanel";
import { FollowButton } from "@/components/public/FollowButton";
import { cn } from "@/lib/utils";
import type { FeatureWithVote } from "@/types";

interface PublicFeatureRowProps {
  slug: string;
  deviceId: string | null;
  feature: FeatureWithVote;
  onVote: (featureId: string, hasVoted: boolean) => void;
  onCommentCountChange: (featureId: string, delta: number) => void;
  onFollowChange: (featureId: string, isFollowing: boolean) => void;
}

export function PublicFeatureRow({
  slug,
  deviceId,
  feature,
  onVote,
  onCommentCountChange,
  onFollowChange,
}: PublicFeatureRowProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onVote(feature.id, feature.hasVoted)}
          className={cn(
            "flex w-12 shrink-0 flex-col items-center rounded-md border py-1 transition-colors",
            feature.hasVoted
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <ChevronUp className="size-4" />
          <span className="text-sm font-medium">{feature.upvoteCount}</span>
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{feature.title}</p>
          {feature.description && (
            <p className="text-muted-foreground text-sm">{feature.description}</p>
          )}
        </div>
        <StatusBadge status={feature.status} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowComments((value) => !value)}
          className="text-muted-foreground flex items-center gap-1.5 text-xs hover:text-foreground"
        >
          <MessageSquare className="size-3.5" />
          {feature.commentCount} comment{feature.commentCount === 1 ? "" : "s"}
        </button>
        {deviceId && (
          <FollowButton
            slug={slug}
            featureId={feature.id}
            deviceId={deviceId}
            isFollowing={feature.isFollowing}
            onToggle={(isFollowing) => onFollowChange(feature.id, isFollowing)}
          />
        )}
      </div>
      {showComments && deviceId && (
        <PublicCommentsPanel
          slug={slug}
          featureId={feature.id}
          deviceId={deviceId}
          onCountChange={(delta) => onCommentCountChange(feature.id, delta)}
        />
      )}
    </Card>
  );
}
