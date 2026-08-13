"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FeatureWithVote } from "@/types";

interface SubmitRequestFormProps {
  slug: string;
  deviceId: string;
  onCreated: (feature: FeatureWithVote) => void;
}

export function SubmitRequestForm({ slug, deviceId, onCreated }: SubmitRequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/board/${slug}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ title, description, email: email || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to submit request.");

      onCreated({ ...data, hasVoted: false, isFollowing: Boolean(email) });
      setTitle("");
      setDescription("");
      setEmail("");
      toast.success("Request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="public-title">Title</Label>
          <Input
            id="public-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="public-description">Description (optional)</Label>
          <Input
            id="public-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="public-email">Email (optional)</Label>
          <Input
            id="public-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Get notified when this ships"
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit request"}
        </Button>
      </form>
    </Card>
  );
}
