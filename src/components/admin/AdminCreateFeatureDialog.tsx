"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { FEATURE_STATUSES, type Feature, type FeatureStatus } from "@/types";

interface AdminCreateFeatureDialogProps {
  appId: string;
  onCreated: (feature: Feature) => void;
}

export function AdminCreateFeatureDialog({ appId, onCreated }: AdminCreateFeatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FeatureStatus>("open");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/apps/${appId}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ title, description, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to create feature.");

      toast.success("Feature created");
      onCreated(data.feature);
      setOpen(false);
      setTitle("");
      setDescription("");
      setStatus("open");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create feature.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>New feature</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a feature request</DialogTitle>
          <DialogDescription>Adds a feature request directly to this app&apos;s board.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="featureTitle">Title</Label>
            <Input
              id="featureTitle"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              minLength={3}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="featureDescription">Description</Label>
            <textarea
              id="featureDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={1000}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:ring-3 md:text-sm dark:bg-input/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as FeatureStatus)}>
              <SelectTrigger size="sm" className="w-40">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create feature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
