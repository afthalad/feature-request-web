"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { STATUS_LABEL } from "@/components/features/StatusBadge";
import { cn } from "@/lib/utils";
import { FEATURE_STATUSES, type AdminComment, type Feature, type FeatureStatus } from "@/types";

interface AdminFeatureDetailProps {
  appId: string;
  feature: Feature;
  initialComments: AdminComment[];
}

async function authedFetch(path: string, init?: RequestInit) {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message ?? "Request failed.");
  return data;
}

export function AdminFeatureDetail({ appId, feature, initialComments }: AdminFeatureDetailProps) {
  const router = useRouter();
  const [title, setTitle] = useState(feature.title);
  const [description, setDescription] = useState(feature.description);
  const [status, setStatus] = useState<FeatureStatus>(feature.status);
  const [comments, setComments] = useState(initialComments);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    try {
      await authedFetch(`/api/admin/apps/${appId}/features/${feature.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, description, status }),
      });
      toast.success("Feature updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await authedFetch(`/api/admin/apps/${appId}/features/${feature.id}`, { method: "DELETE" });
      toast.success("Feature deleted");
      router.push(`/admin/apps/${appId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete.");
      setIsDeleting(false);
    }
  }

  async function handleDeleteComment() {
    if (!pendingCommentId) return;
    const commentId = pendingCommentId;
    try {
      await authedFetch(
        `/api/admin/apps/${appId}/features/${feature.id}/comments/${commentId}`,
        { method: "DELETE" }
      );
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete comment.");
    } finally {
      setPendingCommentId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:ring-3 md:text-sm dark:bg-input/30"
          />
        </div>
        <div className="flex items-end gap-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as FeatureStatus)}>
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEATURE_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {STATUS_LABEL[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {feature.upvoteCount} votes · {feature.followerCount} followers
        </p>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger render={<Button variant="destructive" size="sm" />}>
            Delete feature
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this feature request?</DialogTitle>
              <DialogDescription>
                This permanently deletes the feature, its comments, votes, and followers. This
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-medium">Comments ({comments.length})</p>
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No comments.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-lg border p-3 text-sm",
                  comment.isDeleted && "opacity-50"
                )}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.authorName}</span>
                    {comment.isDeveloper && <Badge variant="outline">Developer</Badge>}
                    {comment.isDeleted && <Badge variant="outline">Soft-deleted</Badge>}
                  </div>
                  <p className="text-muted-foreground">{comment.text}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPendingCommentId(comment.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={pendingCommentId !== null} onOpenChange={(open) => !open && setPendingCommentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this comment?</DialogTitle>
            <DialogDescription>
              This permanently removes the comment. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingCommentId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteComment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
