"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeatureRow } from "@/components/features/FeatureRow";
import type { Feature, FeatureStatus } from "@/types";

type BoardTab = "top" | "new";
const PAGE_SIZE = 20;

interface FeatureListProps {
  appId: string;
  slug: string;
  initialFeatures: Feature[];
  initialCursor: string | null;
}

export function FeatureList({ appId, slug, initialFeatures, initialCursor }: FeatureListProps) {
  const [tab, setTab] = useState<BoardTab>("new");
  const [features, setFeatures] = useState(initialFeatures);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchPage(sort: BoardTab, cursorParam: string | null, append: boolean) {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE) });
      if (cursorParam) params.set("cursor", cursorParam);

      const response = await fetch(`/api/internal/apps/${appId}/features?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to load feature requests.");

      setFeatures((prev) => (append ? [...prev, ...data.features] : data.features));
      setCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }

  function handleTabChange(nextTab: BoardTab) {
    setTab(nextTab);
    fetchPage(nextTab, null, false);
  }

  function handleStatusChange(featureId: string, status: FeatureStatus) {
    setFeatures((prev) => prev.map((f) => (f.id === featureId ? { ...f, status } : f)));
  }

  function handleCommentCountChange(featureId: string, delta: number) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, commentCount: f.commentCount + delta } : f))
    );
  }

  if (features.length === 0 && !cursor && !isLoading) {
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
      <Tabs value={tab} onValueChange={(value) => handleTabChange(value as BoardTab)}>
        <TabsList>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="space-y-3">
        {features.map((feature) => (
          <FeatureRow
            key={feature.id}
            appId={appId}
            feature={feature}
            onStatusChange={(status) => handleStatusChange(feature.id, status)}
            onCommentCountChange={handleCommentCountChange}
          />
        ))}
      </div>
      {cursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPage(tab, cursor, true)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
