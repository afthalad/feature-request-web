"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { getStoredDisplayName, setStoredDisplayName } from "@/lib/device/displayName";
import { CommentItem } from "@/components/comments/CommentItem";
import { CommentsSkeleton } from "@/components/comments/CommentsSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/types";

const PAGE_SIZE = 20;

interface PublicCommentsPanelProps {
  slug: string;
  featureId: string;
  deviceId: string;
  onCountChange: (delta: number) => void;
}

export function PublicCommentsPanel({
  slug,
  featureId,
  deviceId,
  onCountChange,
}: PublicCommentsPanelProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAuthorName(getStoredDisplayName());
    fetch(`/api/public/board/${slug}/features/${featureId}/comments?limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments ?? []);
        setCursor(data.nextCursor ?? null);
      })
      .catch(() => setComments([]));
  }, [slug, featureId]);

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
    <div className="space-y-3 border-t pt-3">
      {comments === null ? (
        <CommentsSkeleton />
      ) : comments.length === 0 ? (
        <div className="text-muted-foreground flex items-center gap-1.5 py-2 text-xs">
          <MessageCircle className="size-3.5" />
          <span>No comments yet.</span>
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
      <form onSubmit={handleSubmit} className="space-y-2">
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
            Post
          </Button>
        </div>
      </form>
    </div>
  );
}
