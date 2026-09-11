"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
import { auth } from "@/lib/firebase/client";
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

interface DashboardCommentsPanelProps {
  appId: string;
  featureId: string;
  featureTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCountChange: (delta: number) => void;
}

export function DashboardCommentsPanel({
  appId,
  featureId,
  featureTitle,
  open,
  onOpenChange,
  onCountChange,
}: DashboardCommentsPanelProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `/api/internal/features/${featureId}/comments?appId=${appId}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const data = await response.json();
      setComments(data.comments ?? []);
      setCursor(data.nextCursor ?? null);
    })();
  }, [open, appId, featureId]);

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `/api/internal/features/${featureId}/comments?appId=${appId}&limit=${PAGE_SIZE}&cursor=${cursor}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
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
              <p className="text-muted-foreground text-xs">No comments yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} onDelete={handleDelete} />
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

        <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-3">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Reply as developer"
            maxLength={1000}
            required
          />
          <Button type="submit" size="sm" disabled={isSubmitting}>
            <Send className="size-3.5" />
            Reply
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
