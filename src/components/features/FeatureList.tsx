"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Inbox, Loader2Icon } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureRow } from "@/components/features/FeatureRow";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";
import type { Feature, FeatureStatus } from "@/types";

type BoardTab = "top" | "pending" | "approved";
const PAGE_SIZE = 20;

interface FeatureListProps {
  appId: string;
  slug: string;
  initialFeatures: Feature[];
  initialCursor: string | null;
  initialHiddenCount: number;
  initialTotalCount: number | null;
  newSinceIso: string | null;
}

export function FeatureList({
  appId,
  slug,
  initialFeatures,
  initialCursor,
  initialHiddenCount,
  initialTotalCount,
  newSinceIso,
}: FeatureListProps) {
  const [tab, setTab] = useState<BoardTab>("pending");
  const [features, setFeatures] = useState(initialFeatures);
  const [cursor, setCursor] = useState(initialCursor);
  const [hiddenCount, setHiddenCount] = useState(initialHiddenCount);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingTab, setIsSwitchingTab] = useState(false);
  const requestIdRef = useRef(0);

  async function fetchPage(
    boardTab: BoardTab,
    cursorParam: string | null,
    append: boolean,
    servedCount: number,
  ) {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    if (!append) setIsSwitchingTab(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const params = new URLSearchParams({
        tab: boardTab,
        limit: String(PAGE_SIZE),
        served: String(servedCount),
      });
      if (cursorParam) params.set("cursor", cursorParam);

      const response = await fetch(
        `/api/internal/apps/${appId}/features?${params}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error?.message ?? "Failed to load feature requests.",
        );

      if (requestId !== requestIdRef.current) return;
      setFeatures((prev) =>
        append ? [...prev, ...data.features] : data.features,
      );
      setCursor(data.nextCursor);
      if (boardTab === "pending") {
        setHiddenCount(data.hiddenCount ?? 0);
        setTotalCount(data.totalCount ?? null);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsSwitchingTab(false);
      }
    }
  }

  function handleTabChange(nextTab: BoardTab) {
    setTab(nextTab);
    fetchPage(nextTab, null, false, 0);
  }

  function handleLoadMore() {
    if (!cursor) return;
    fetchPage(tab, cursor, true, features.length);
  }

  function handleStatusChange(featureId: string, status: FeatureStatus) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, status } : f)),
    );
  }

  function handleCommentCountChange(featureId: string, delta: number) {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === featureId ? { ...f, commentCount: f.commentCount + delta } : f,
      ),
    );
  }

  function handleDelete(featureId: string) {
    setFeatures((prev) => prev.filter((f) => f.id !== featureId));
    if (tab === "pending") {
      setTotalCount((prev) => (prev !== null ? Math.max(0, prev - 1) : prev));
    }
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onValueChange={(value) => handleTabChange(value as BoardTab)}
      >
        <TabsList>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "pending" && hiddenCount > 0 && !isSwitchingTab && (
        <UpgradeBanner
          title="Some feature requests are hidden"
          message={`This project has ${totalCount ?? hiddenCount} feature request${(totalCount ?? hiddenCount) === 1 ? "" : "s"}. Upgrade to view all.`}
        />
      )}

      {isSwitchingTab ? (
        <div className="divide-y rounded-lg border">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-start gap-3 px-4 py-4">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : features.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No feature requests here"
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
      ) : (
        <div className="divide-y rounded-lg border">
          {features.map((feature) => (
            <FeatureRow
              key={feature.id}
              appId={appId}
              feature={feature}
              isNew={!newSinceIso || feature.createdAt > newSinceIso}
              onStatusChange={(status) => handleStatusChange(feature.id, status)}
              onCommentCountChange={handleCommentCountChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {cursor && !isSwitchingTab && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
