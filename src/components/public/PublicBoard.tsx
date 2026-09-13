"use client";

import { useEffect, useState } from "react";
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
type FetchableSort = "top" | "new";
const PAGE_SIZE = 20;

interface PublicBoardProps {
  slug: string;
  initialFeatures: FeatureWithVote[];
  initialCursor: string | null;
  hideVoteCounts?: boolean;
}

export function PublicBoard({
  slug,
  initialFeatures,
  initialCursor,
  hideVoteCounts,
}: PublicBoardProps) {
  const [features, setFeatures] = useState(initialFeatures);
  const [cursor, setCursor] = useState(initialCursor);
  const [tab, setTab] = useState<BoardTab>("new");
  const [showForm, setShowForm] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    // Refetch page 1 with the real device id so hasVoted/isFollowing (unknown during SSR) are accurate.
    fetchPage("new", deviceId, null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function fetchPage(
    sort: FetchableSort,
    currentDeviceId: string,
    cursorParam: string | null,
    append: boolean
  ) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE) });
      if (cursorParam) params.set("cursor", cursorParam);

      const response = await fetch(`/api/public/board/${slug}/features?${params}`, {
        headers: { "X-Device-Id": currentDeviceId },
      });
      const data = await response.json();
      if (Array.isArray(data.features)) {
        setFeatures((prev) => (append ? [...prev, ...data.features] : data.features));
        setCursor(data.nextCursor ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleTabChange(nextTab: BoardTab) {
    setTab(nextTab);
    if (nextTab !== "roadmap" && deviceId) {
      fetchPage(nextTab, deviceId, null, false);
    }
  }

  function handleLoadMore() {
    if (!deviceId || tab === "roadmap") return;
    fetchPage(tab, deviceId, cursor, true);
  }

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(value) => handleTabChange(value as BoardTab)}>
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
      {features.length === 0 && !cursor && !isLoading ? (
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
          hideVoteCounts={hideVoteCounts}
        />
      ) : (
        <>
          <div className="divide-y rounded-lg border">
            {features.map((feature) => (
              <PublicFeatureRow
                key={feature.id}
                slug={slug}
                deviceId={deviceId}
                feature={feature}
                onVote={handleVote}
                onCommentCountChange={handleCommentCountChange}
                onFollowChange={handleFollowChange}
                hideVoteCounts={hideVoteCounts}
              />
            ))}
          </div>
          {cursor && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
