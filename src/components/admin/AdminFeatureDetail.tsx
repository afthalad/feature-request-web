"use client";

import { useState, type FormEvent } from "react";
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
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { FEATURE_STATUSES, type AdminComment, type Feature, type FeatureStatus, type Follower } from "@/types";

const FOLLOWERS_PAGE_SIZE = 20;

interface AdminFeatureDetailProps {
  appId: string;
  feature: Feature;
  initialComments: AdminComment[];
  initialFollowers: Follower[];
  initialFollowersCursor: string | null;
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

export function AdminFeatureDetail({
  appId,
  feature,
  initialComments,
  initialFollowers,
  initialFollowersCursor,
}: AdminFeatureDetailProps) {
  const router = useRouter();
  const [title, setTitle] = useState(feature.title);
  const [description, setDescription] = useState(feature.description);
  const [status, setStatus] = useState<FeatureStatus>(feature.status);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Comments
  const [comments, setComments] = useState(initialComments);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);

  // Followers
  const [followers, setFollowers] = useState(initialFollowers);
  const [followerCount, setFollowerCount] = useState(feature.followerCount);
  const [followersCursor, setFollowersCursor] = useState(initialFollowersCursor);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [newFollowerEmail, setNewFollowerEmail] = useState("");
  const [isAddingFollower, setIsAddingFollower] = useState(false);
  const [pendingFollowerId, setPendingFollowerId] = useState<string | null>(null);

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

  async function handlePostComment(event: FormEvent) {
    event.preventDefault();
    setIsPostingComment(true);
    try {
      const { comment } = await authedFetch(
        `/api/admin/apps/${appId}/features/${feature.id}/comments`,
        { method: "POST", body: JSON.stringify({ text: newCommentText, authorName: newCommentAuthor || undefined }) }
      );
      setComments((prev) => [...prev, comment]);
      setNewCommentText("");
      toast.success("Comment posted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post comment.");
    } finally {
      setIsPostingComment(false);
    }
  }

  function startEditingComment(comment: AdminComment) {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  }

  async function handleSaveComment(commentId: string) {
    setIsSavingComment(true);
    try {
      await authedFetch(`/api/admin/apps/${appId}/features/${feature.id}/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ text: editingText }),
      });
      setComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? { ...comment, text: editingText } : comment))
      );
      setEditingCommentId(null);
      toast.success("Comment updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update comment.");
    } finally {
      setIsSavingComment(false);
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

  async function handleAddFollower(event: FormEvent) {
    event.preventDefault();
    setIsAddingFollower(true);
    try {
      const { follower } = await authedFetch(
        `/api/admin/apps/${appId}/features/${feature.id}/followers`,
        { method: "POST", body: JSON.stringify({ email: newFollowerEmail }) }
      );
      setFollowers((prev) => [follower, ...prev]);
      setFollowerCount((prev) => prev + 1);
      setNewFollowerEmail("");
      toast.success("Follower added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add follower.");
    } finally {
      setIsAddingFollower(false);
    }
  }

  async function handleLoadMoreFollowers() {
    setIsLoadingFollowers(true);
    try {
      const params = new URLSearchParams({ limit: String(FOLLOWERS_PAGE_SIZE) });
      if (followersCursor) params.set("cursor", followersCursor);
      const data = await authedFetch(
        `/api/admin/apps/${appId}/features/${feature.id}/followers?${params}`
      );
      setFollowers((prev) => [...prev, ...data.followers]);
      setFollowersCursor(data.nextCursor);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load followers.");
    } finally {
      setIsLoadingFollowers(false);
    }
  }

  async function handleRemoveFollower() {
    if (!pendingFollowerId) return;
    const followerId = pendingFollowerId;
    try {
      await authedFetch(
        `/api/admin/apps/${appId}/features/${feature.id}/followers/${followerId}`,
        { method: "DELETE" }
      );
      setFollowers((prev) => prev.filter((follower) => follower.id !== followerId));
      setFollowerCount((prev) => Math.max(0, prev - 1));
      toast.success("Follower removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove follower.");
    } finally {
      setPendingFollowerId(null);
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
          {feature.upvoteCount} votes · {followerCount} followers
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
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.authorName}</span>
                    {comment.isDeveloper && <Badge variant="outline">Developer</Badge>}
                    {comment.isDeleted && <Badge variant="outline">Soft-deleted</Badge>}
                    <span className="text-muted-foreground text-xs">{formatDate(comment.createdAt)}</span>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        rows={2}
                        maxLength={1000}
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveComment(comment.id)} disabled={isSavingComment}>
                          {isSavingComment ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{comment.text}</p>
                  )}
                </div>
                {editingCommentId !== comment.id && !comment.isDeleted && (
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditingComment(comment)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingCommentId(comment.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handlePostComment} className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">Post a comment as admin</p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={newCommentAuthor}
              onChange={(event) => setNewCommentAuthor(event.target.value)}
              placeholder="Author name (optional)"
              maxLength={60}
              className="max-w-48"
            />
          </div>
          <textarea
            value={newCommentText}
            onChange={(event) => setNewCommentText(event.target.value)}
            placeholder="Write a reply..."
            rows={2}
            maxLength={1000}
            required
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30"
          />
          <Button type="submit" size="sm" disabled={isPostingComment || !newCommentText.trim()}>
            {isPostingComment ? "Posting..." : "Post comment"}
          </Button>
        </form>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-medium">Followers ({followerCount})</p>
        {followers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No followers yet.</p>
        ) : (
          <ul className="space-y-2">
            {followers.map((follower) => (
              <li key={follower.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{follower.email}</p>
                  <p className="text-muted-foreground text-xs">Following since {formatDate(follower.createdAt)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPendingFollowerId(follower.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        {followersCursor && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={handleLoadMoreFollowers} disabled={isLoadingFollowers}>
              {isLoadingFollowers ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
        <form onSubmit={handleAddFollower} className="flex gap-2 border-t pt-3">
          <Input
            type="email"
            value={newFollowerEmail}
            onChange={(event) => setNewFollowerEmail(event.target.value)}
            placeholder="email@example.com"
            required
            className="max-w-64"
          />
          <Button type="submit" size="sm" variant="outline" disabled={isAddingFollower}>
            {isAddingFollower ? "Adding..." : "Add follower"}
          </Button>
        </form>
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

      <Dialog open={pendingFollowerId !== null} onOpenChange={(open) => !open && setPendingFollowerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this follower?</DialogTitle>
            <DialogDescription>
              They will stop receiving status update emails for this feature.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingFollowerId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveFollower}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
