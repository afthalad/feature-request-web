"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeatureRow } from "@/components/features/FeatureRow";
import { RoadmapBoard } from "@/components/features/RoadmapBoard";
import type { Feature, FeatureStatus } from "@/types";

type BoardTab = "top" | "new" | "roadmap";

interface FeatureListProps {
  appId: string;
  slug: string;
  initialFeatures: Feature[];
}

export function FeatureList({ appId, slug, initialFeatures }: FeatureListProps) {
  const [features, setFeatures] = useState(initialFeatures);
  const [tab, setTab] = useState<BoardTab>("new");

  const sortedFeatures = useMemo(() => {
    const copy = [...features];
    if (tab === "top") {
      copy.sort((a, b) => b.upvoteCount - a.upvoteCount);
    } else {
      copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return copy;
  }, [features, tab]);

  function handleStatusChange(featureId: string, status: FeatureStatus) {
    setFeatures((prev) => prev.map((f) => (f.id === featureId ? { ...f, status } : f)));
  }

  function handleCommentCountChange(featureId: string, delta: number) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, commentCount: f.commentCount + delta } : f))
    );
  }

  if (features.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No feature requests yet"
        description="Share your public board so users can start submitting ideas."
        action={
          slug && (
            <Link
              href={`/b/${slug}`}
              target="_blank"
              className={buttonVariants({ variant: "outline" })}
            >
              Share your public board
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as BoardTab)}>
        <TabsList>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "roadmap" ? (
        <RoadmapBoard
          appId={appId}
          features={features}
          onStatusChange={handleStatusChange}
          onCommentCountChange={handleCommentCountChange}
        />
      ) : (
        <div className="space-y-3">
          {sortedFeatures.map((feature) => (
            <FeatureRow
              key={feature.id}
              appId={appId}
              feature={feature}
              onStatusChange={(status) => handleStatusChange(feature.id, status)}
              onCommentCountChange={handleCommentCountChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
