"use client";

import { useState, type FormEvent } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FollowButtonProps {
  slug: string;
  featureId: string;
  deviceId: string;
  isFollowing: boolean;
  onToggle: (isFollowing: boolean) => void;
}

export function FollowButton({
  slug,
  featureId,
  deviceId,
  isFollowing,
  onToggle,
}: FollowButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUnfollow() {
    try {
      const response = await fetch(`/api/public/board/${slug}/features/${featureId}/follow`, {
        method: "DELETE",
        headers: { "X-Device-Id": deviceId },
      });
      if (!response.ok) throw new Error();
      onToggle(false);
    } catch {
      toast.error("Failed to unfollow.");
    }
  }

  async function handleFollow(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/board/${slug}/features/${featureId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      onToggle(true);
      setOpen(false);
      toast.success("You'll get an email when this ships");
    } catch {
      toast.error("Failed to follow.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isFollowing) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={handleUnfollow}>
        <Bell className="size-3.5" />
        Following
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BellOff className="size-3.5" />
        Follow
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get notified</DialogTitle>
          <DialogDescription>
            We&apos;ll email you when the status of this request changes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFollow} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Following..." : "Follow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
