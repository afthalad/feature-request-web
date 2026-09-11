"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/features/StatusBadge";
import type { Feature } from "@/types";

type SortTab = "top" | "new";
const PAGE_SIZE = 20;

interface AdminFeatureListProps {
  appId: string;
  initialFeatures: Feature[];
  initialCursor: string | null;
}

export function AdminFeatureList({ appId, initialFeatures, initialCursor }: AdminFeatureListProps) {
  const [tab, setTab] = useState<SortTab>("new");
  const [features, setFeatures] = useState(initialFeatures);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchPage(sort: SortTab, cursorParam: string | null, append: boolean) {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE) });
      if (cursorParam) params.set("cursor", cursorParam);

      const response = await fetch(`/api/admin/apps/${appId}/features?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to load features.");

      setFeatures((prev) => (append ? [...prev, ...data.features] : data.features));
      setCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }

  function handleTabChange(nextTab: SortTab) {
    setTab(nextTab);
    fetchPage(nextTab, null, false);
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(value) => handleTabChange(value as SortTab)}>
        <TabsList>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>
      </Tabs>
      {features.length === 0 ? (
        <p className="text-muted-foreground text-sm">No feature requests yet.</p>
      ) : (
        <div className="space-y-2">
          {features.map((feature) => (
            <Link
              key={feature.id}
              href={`/admin/apps/${appId}/features/${feature.id}`}
              className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{feature.title}</span>
              <span className="text-muted-foreground flex shrink-0 items-center gap-3">
                <span>{feature.upvoteCount} votes</span>
                <span>{feature.commentCount} comments</span>
                <StatusBadge status={feature.status} />
              </span>
            </Link>
          ))}
        </div>
      )}
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
