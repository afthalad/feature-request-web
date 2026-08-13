"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getStoredDisplayName, setStoredDisplayName } from "@/lib/device/displayName";
import { CommentItem } from "@/components/comments/CommentItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/types";

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
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAuthorName(getStoredDisplayName());
    fetch(`/api/public/board/${slug}/features/${featureId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
  }, [slug, featureId]);

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
        <p className="text-muted-foreground text-xs">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-xs">No comments yet.</p>
      ) : (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
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
