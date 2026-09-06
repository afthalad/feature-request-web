"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { CommentItem } from "@/components/comments/CommentItem";
import { CommentsSkeleton } from "@/components/comments/CommentsSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/types";

interface DashboardCommentsPanelProps {
  appId: string;
  featureId: string;
  onCountChange: (delta: number) => void;
}

export function DashboardCommentsPanel({
  appId,
  featureId,
  onCountChange,
}: DashboardCommentsPanelProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `/api/internal/features/${featureId}/comments?appId=${appId}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const data = await response.json();
      setComments(data.comments ?? []);
    })();
  }, [appId, featureId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/internal/features/${featureId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ appId, text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to post reply.");

      setComments((prev) => [...(prev ?? []), data]);
      setText("");
      onCountChange(1);
      toast.success("Reply posted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/internal/features/${featureId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ appId }),
      });
      if (!response.ok) throw new Error("Failed to delete comment.");

      setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId));
      onCountChange(-1);
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete comment.");
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
            <CommentItem key={comment.id} comment={comment} onDelete={handleDelete} />
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Reply as developer"
          maxLength={1000}
          required
        />
        <Button type="submit" size="sm" disabled={isSubmitting}>
          Reply
        </Button>
      </form>
    </div>
  );
}
