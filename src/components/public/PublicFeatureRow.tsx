"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { FeatureVoteIndicator } from "@/components/features/FeatureVoteIndicator";
import { StatusBadge } from "@/components/features/StatusBadge";
import { PublicCommentsPanel } from "@/components/comments/PublicCommentsPanel";
import { FollowButton } from "@/components/public/FollowButton";
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
    <div className="flex items-start gap-3 px-4 py-4">
      <div className="self-center">
        <FeatureVoteIndicator
          status={feature.status}
          upvoteCount={feature.upvoteCount}
          hasVoted={feature.hasVoted}
          onClick={() => onVote(feature.id, feature.hasVoted)}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="font-medium">{feature.title}</p>
        {feature.description && (
          <p className="text-muted-foreground text-sm">{feature.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => setShowComments((value) => !value)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
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
      </div>
      <div className="shrink-0 self-center">
        <StatusBadge status={feature.status} />
      </div>
      {deviceId && (
        <PublicCommentsPanel
          slug={slug}
          featureId={feature.id}
          featureTitle={feature.title}
          deviceId={deviceId}
          open={showComments}
          onOpenChange={setShowComments}
          onCountChange={(delta) => onCommentCountChange(feature.id, delta)}
        />
      )}
    </div>
  );
}
