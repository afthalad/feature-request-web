"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Inbox, Loader2Icon } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureRow } from "@/components/features/FeatureRow";
import { LockedFeatureRow } from "@/components/features/LockedFeatureRow";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";
import { APP_PLATFORM_MAP } from "@/lib/appPlatforms";
import type { AppPlatformId, Feature, FeatureStatus } from "@/types";

type StatusFilter = "all" | "pending" | "approved";
type SortOrder = "newest" | "oldest" | "top";
type AuthorFilter = "everyone" | "paid";

interface Filters {
  status: StatusFilter;
  sort: SortOrder;
  author: AuthorFilter;
  platform: AppPlatformId | "all";
}

const PAGE_SIZE = 20;
const DEFAULT_FILTERS: Filters = {
  status: "all",
  sort: "newest",
  author: "everyone",
  platform: "all",
};

const SORT_LABEL: Record<SortOrder, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  top: "Most votes",
};

const AUTHOR_LABEL: Record<AuthorFilter, string> = {
  everyone: "Everyone",
  paid: "Paid users",
};

interface FeatureListProps {
  appId: string;
  slug: string;
  initialFeatures: Feature[];
  initialCursor: string | null;
  initialHiddenCount: number;
  newSinceIso: string | null;
  platforms: AppPlatformId[];
}

export function FeatureList({
  appId,
  slug,
  initialFeatures,
  initialCursor,
  initialHiddenCount,
  newSinceIso,
  platforms,
}: FeatureListProps) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [features, setFeatures] = useState(initialFeatures);
  const [cursor, setCursor] = useState(initialCursor);
  const [hiddenCount, setHiddenCount] = useState(initialHiddenCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingTab, setIsSwitchingTab] = useState(false);
  const requestIdRef = useRef(0);
  const isFiltered =
    filters.status !== "all" ||
    filters.author !== "everyone" ||
    filters.platform !== "all";

  async function fetchPage(
    pageFilters: Filters,
    cursorParam: string | null,
    append: boolean,
  ) {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    if (!append) setIsSwitchingTab(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const params = new URLSearchParams({
        status: pageFilters.status,
        sort: pageFilters.sort,
        limit: String(PAGE_SIZE),
      });
      if (pageFilters.author === "paid") params.set("paid", "true");
      if (pageFilters.platform !== "all")
        params.set("platform", pageFilters.platform);
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
      setHiddenCount(data.hiddenCount ?? 0);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsSwitchingTab(false);
      }
    }
  }

  function handleFilterChange(change: Partial<Filters>) {
    const nextFilters = { ...filters, ...change };
    setFilters(nextFilters);
    fetchPage(nextFilters, null, false);
  }

  function handleLoadMore() {
    if (!cursor) return;
    fetchPage(filters, cursor, true);
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
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={filters.status}
          onValueChange={(value) =>
            handleFilterChange({ status: value as StatusFilter })
          }
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.author}
            onValueChange={(value) =>
              handleFilterChange({ author: value as AuthorFilter })
            }
          >
            <SelectTrigger size="sm">
              <SelectValue>{AUTHOR_LABEL[filters.author]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(AUTHOR_LABEL) as AuthorFilter[]).map((author) => (
                <SelectItem key={author} value={author}>
                  {AUTHOR_LABEL[author]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {platforms.length > 1 && (
            <Select
              value={filters.platform}
              onValueChange={(value) =>
                handleFilterChange({ platform: value as Filters["platform"] })
              }
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {filters.platform === "all"
                    ? "All platforms"
                    : APP_PLATFORM_MAP[filters.platform].label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {APP_PLATFORM_MAP[platform].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              handleFilterChange({ sort: value as SortOrder })
            }
          >
            <SelectTrigger size="sm">
              <SelectValue>{SORT_LABEL[filters.sort]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as SortOrder[]).map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {SORT_LABEL[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hiddenCount > 0 && !isSwitchingTab && (
        <UpgradeBanner
          title={`${hiddenCount} feature request${hiddenCount === 1 ? " is" : "s are"} locked`}
          message="Your plan shows this app's first requests. Upgrade to see all of them."
        />
      )}

      {isSwitchingTab ? (
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="bg-surface flex items-start gap-3 rounded-lg px-4 py-4"
            >
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : features.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Inbox}
            title="No feature requests match"
            description="Try another filter to see more requests."
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="No feature requests here"
            description={
              slug
                ? "Share your public board so users can start submitting ideas."
                : "Add the board to your app so users can start submitting ideas."
            }
            action={
              slug && (
                <Link
                  href={`/b/${slug}`}
                  target="_blank"
                  className={buttonVariants({
                    variant: "secondary",
                  })}
                >
                  Share your public board
                </Link>
              )
            }
          />
        )
      ) : (
        <div className="space-y-2">
          {features.map((feature) =>
            feature.locked ? (
              <LockedFeatureRow key={feature.id} feature={feature} />
            ) : (
              <FeatureRow
                key={feature.id}
                appId={appId}
                feature={feature}
                isNew={!newSinceIso || feature.createdAt > newSinceIso}
                onStatusChange={(status) =>
                  handleStatusChange(feature.id, status)
                }
                onCommentCountChange={handleCommentCountChange}
                onDelete={handleDelete}
              />
            ),
          )}
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
