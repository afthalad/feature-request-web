"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
import { getStoredDisplayName, setStoredDisplayName } from "@/lib/device/displayName";
import { CommentItem } from "@/components/comments/CommentItem";
import { AvatarListSkeleton } from "@/components/ui/avatar-list-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Comment } from "@/types";

const PAGE_SIZE = 20;

interface PublicCommentsPanelProps {
  slug: string;
  featureId: string;
  featureTitle: string;
  deviceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCountChange: (delta: number) => void;
}

export function PublicCommentsPanel({
  slug,
  featureId,
  featureTitle,
  deviceId,
  open,
  onOpenChange,
  onCountChange,
}: PublicCommentsPanelProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAuthorName(getStoredDisplayName());
    fetch(`/api/public/board/${slug}/features/${featureId}/comments?limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments ?? []);
        setCursor(data.nextCursor ?? null);
      })
      .catch(() => setComments([]));
  }, [open, slug, featureId]);

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/public/board/${slug}/features/${featureId}/comments?limit=${PAGE_SIZE}&cursor=${cursor}`
      );
      const data = await response.json();
      setComments((prev) => [...(prev ?? []), ...(data.comments ?? [])]);
      setCursor(data.nextCursor ?? null);
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/board/${slug}/features/${featureId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ text, authorName: authorName || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to post comment.");

      if (authorName) setStoredDisplayName(authorName);
      setComments((prev) => [...(prev ?? []), data]);
      setText("");
      onCountChange(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="line-clamp-2">{featureTitle}</SheetTitle>
          <SheetDescription>Comments</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {comments === null ? (
            <AvatarListSkeleton />
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
              <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full">
                <MessageCircle className="size-4" />
              </div>
              <p className="text-muted-foreground text-xs">No comments yet. Be the first to reply.</p>
            </div>
          ) : (
            <div className="divide-y">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
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
                {isLoadingMore ? "Loading..." : "Load more comments"}
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2 border-t pt-3">
          <Input
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="Your name (optional)"
            maxLength={60}
          />
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Add a comment"
              maxLength={1000}
              required
            />
            <Button type="submit" size="sm" disabled={isSubmitting}>
              <Send className="size-3.5" />
              Post
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
