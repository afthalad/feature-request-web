"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { getOrCreateDeviceId } from "@/lib/device/deviceId";
import { PublicFeatureRow } from "@/components/public/PublicFeatureRow";
import { PublicRoadmapBoard } from "@/components/public/PublicRoadmapBoard";
import { SubmitRequestForm } from "@/components/public/SubmitRequestForm";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { FeatureWithVote } from "@/types";

type BoardTab = "top" | "new" | "roadmap";

interface PublicBoardProps {
  slug: string;
  initialFeatures: FeatureWithVote[];
}

export function PublicBoard({ slug, initialFeatures }: PublicBoardProps) {
  const [features, setFeatures] = useState(initialFeatures);
  const [tab, setTab] = useState<BoardTab>("new");
  const [showForm, setShowForm] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    fetch(`/api/public/board/${slug}/features?sort=new&limit=50`, {
      headers: { "X-Device-Id": id },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.features)) setFeatures(data.features);
      })
      .catch(() => {});
  }, [slug]);

  const sortedFeatures = useMemo(() => {
    const copy = [...features];
    if (tab === "top") {
      copy.sort((a, b) => b.upvoteCount - a.upvoteCount);
    } else {
      copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return copy;
  }, [features, tab]);

  async function handleVote(featureId: string, hasVoted: boolean) {
    if (!deviceId) return;

    setFeatures((prev) =>
      prev.map((f) =>
        f.id === featureId
          ? { ...f, hasVoted: !hasVoted, upvoteCount: f.upvoteCount + (hasVoted ? -1 : 1) }
          : f
      )
    );

    try {
      const response = await fetch(`/api/public/board/${slug}/features/${featureId}/vote`, {
        method: hasVoted ? "DELETE" : "POST",
        headers: { "X-Device-Id": deviceId },
      });
      if (!response.ok) throw new Error("Vote failed");
      const data = await response.json();
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === featureId ? { ...f, upvoteCount: data.upvoteCount, hasVoted: data.hasVoted } : f
        )
      );
    } catch {
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === featureId
            ? { ...f, hasVoted, upvoteCount: f.upvoteCount + (hasVoted ? 1 : -1) }
            : f
        )
      );
    }
  }

  function handleCreated(feature: FeatureWithVote) {
    setFeatures((prev) => [feature, ...prev]);
    setShowForm(false);
  }

  function handleCommentCountChange(featureId: string, delta: number) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, commentCount: f.commentCount + delta } : f))
    );
  }

  function handleFollowChange(featureId: string, isFollowing: boolean) {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === featureId
          ? { ...f, isFollowing, followerCount: f.followerCount + (isFollowing ? 1 : -1) }
          : f
      )
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as BoardTab)}>
          <TabsList>
            <TabsTrigger value="top">Top</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Cancel" : "New request"}
        </Button>
      </div>
      {showForm && deviceId && (
        <SubmitRequestForm slug={slug} deviceId={deviceId} onCreated={handleCreated} />
      )}
      {features.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No feature requests yet"
          description="Be the first to suggest something for this app."
          action={
            !showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                New request
              </Button>
            )
          }
        />
      ) : tab === "roadmap" ? (
        <PublicRoadmapBoard
          slug={slug}
          deviceId={deviceId}
          features={features}
          onVote={handleVote}
          onCommentCountChange={handleCommentCountChange}
          onFollowChange={handleFollowChange}
        />
      ) : (
        <div className="space-y-3">
          {sortedFeatures.map((feature) => (
            <PublicFeatureRow
              key={feature.id}
              slug={slug}
              deviceId={deviceId}
              feature={feature}
              onVote={handleVote}
              onCommentCountChange={handleCommentCountChange}
              onFollowChange={handleFollowChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
