"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Users, Languages, Crown } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { FeatureVoteIndicator } from "@/components/features/FeatureVoteIndicator";
import { StatusSelect } from "@/components/features/StatusSelect";
import { DashboardCommentsPanel } from "@/components/comments/DashboardCommentsPanel";
import { FollowersPanel } from "@/components/followers/FollowersPanel";
import { Badge } from "@/components/ui/badge";
import type { Feature, FeatureTranslation } from "@/types";

interface FeatureRowProps {
  appId: string;
  appName?: string;
  feature: Feature;
  isNew?: boolean;
  onStatusChange: (status: Feature["status"]) => void;
  onCommentCountChange: (featureId: string, delta: number) => void;
}

function browserLang(): string {
  if (typeof navigator === "undefined") return "en";
  return navigator.language?.split("-")[0] || "en";
}

export function FeatureRow({
  appId,
  appName,
  feature,
  isNew,
  onStatusChange,
  onCommentCountChange,
}: FeatureRowProps) {
  const [showComments, setShowComments] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [translation, setTranslation] = useState<FeatureTranslation | null>(feature.translation);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const targetLang = browserLang();

  async function handleTranslate() {
    if (translation && translation.lang === targetLang) {
      setShowTranslation((value) => !value);
      return;
    }

    setIsTranslating(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/features/${feature.id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ appId, targetLang }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to translate.");

      setTranslation(data);
      setShowTranslation(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to translate.");
    } finally {
      setIsTranslating(false);
    }
  }

  const displayTitle = showTranslation && translation ? translation.title : feature.title;
  const displayDescription =
    showTranslation && translation ? translation.description : feature.description;

  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <div className="self-center">
        <FeatureVoteIndicator status={feature.status} upvoteCount={feature.upvoteCount} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {displayTitle}
          {isNew && (
            <span className="bg-primary text-primary-foreground shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none">
              New
            </span>
          )}
          {feature.authorIsSubscriber && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="size-3" />
              Subscriber
            </Badge>
          )}
        </p>
        {displayDescription && (
          <p className="text-muted-foreground text-sm">{displayDescription}</p>
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
          {feature.followerCount > 0 && (
            <button
              type="button"
              onClick={() => setShowFollowers((value) => !value)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
            >
              <Users className="size-3.5" />
              {feature.followerCount} following
            </button>
          )}
          <button
            type="button"
            onClick={handleTranslate}
            disabled={isTranslating}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
          >
            <Languages className="size-3.5" />
            {isTranslating
              ? "Translating..."
              : showTranslation
                ? "Show original"
                : "Translate"}
          </button>
          {appName && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <Link
                href={`/dashboard/apps/${appId}`}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                {appName}
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 self-center">
        <StatusSelect
          appId={appId}
          featureId={feature.id}
          status={feature.status}
          followerCount={feature.followerCount}
          onStatusChange={onStatusChange}
        />
      </div>
      <DashboardCommentsPanel
        appId={appId}
        featureId={feature.id}
        featureTitle={feature.title}
        open={showComments}
        onOpenChange={setShowComments}
        onCountChange={(delta) => onCommentCountChange(feature.id, delta)}
      />
      <FollowersPanel
        appId={appId}
        featureId={feature.id}
        featureTitle={feature.title}
        open={showFollowers}
        onOpenChange={setShowFollowers}
      />
    </div>
  );
}
