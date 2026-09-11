"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { FollowerItem } from "@/components/followers/FollowerItem";
import { AvatarListSkeleton } from "@/components/ui/avatar-list-skeleton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Follower } from "@/types";

const PAGE_SIZE = 20;

interface FollowersPanelProps {
  appId: string;
  featureId: string;
  featureTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowersPanel({
  appId,
  featureId,
  featureTitle,
  open,
  onOpenChange,
}: FollowersPanelProps) {
  const [followers, setFollowers] = useState<Follower[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `/api/internal/features/${featureId}/followers?appId=${appId}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const data = await response.json();
      setFollowers(data.followers ?? []);
      setCursor(data.nextCursor ?? null);
    })();
  }, [open, appId, featureId]);

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `/api/internal/features/${featureId}/followers?appId=${appId}&limit=${PAGE_SIZE}&cursor=${cursor}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const data = await response.json();
      setFollowers((prev) => [...(prev ?? []), ...(data.followers ?? [])]);
      setCursor(data.nextCursor ?? null);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="line-clamp-2">{featureTitle}</SheetTitle>
          <SheetDescription>Following</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {followers === null ? (
            <AvatarListSkeleton />
          ) : followers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
              <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full">
                <Users className="size-4" />
              </div>
              <p className="text-muted-foreground text-xs">No followers yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {followers.map((follower) => (
                <FollowerItem key={follower.id} follower={follower} />
              ))}
            </div>
          )}
          {cursor && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load more followers"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
