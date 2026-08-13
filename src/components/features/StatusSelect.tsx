"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_LABEL } from "@/components/features/StatusBadge";
import { FEATURE_STATUSES, NOTIFIABLE_STATUSES, type FeatureStatus } from "@/types";

interface StatusSelectProps {
  appId: string;
  featureId: string;
  status: FeatureStatus;
  followerCount: number;
  onStatusChange: (status: FeatureStatus) => void;
}

const DEFAULT_NOTIFY: Record<FeatureStatus, boolean> = {
  open: false,
  planned: true,
  in_progress: false,
  done: true,
  declined: false,
};

export function StatusSelect({
  appId,
  featureId,
  status,
  followerCount,
  onStatusChange,
}: StatusSelectProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<FeatureStatus | null>(null);
  const [notify, setNotify] = useState(true);

  async function commitChange(nextStatus: FeatureStatus, shouldNotify: boolean) {
    const previousStatus = status;
    onStatusChange(nextStatus);
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/features/${featureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ appId, status: nextStatus, notify: shouldNotify }),
      });
      if (!response.ok) throw new Error("Failed to update status.");
    } catch (error) {
      onStatusChange(previousStatus);
      toast.error(error instanceof Error ? error.message : "Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSelectChange(nextStatus: FeatureStatus) {
    if (followerCount > 0 && NOTIFIABLE_STATUSES.includes(nextStatus)) {
      setNotify(DEFAULT_NOTIFY[nextStatus]);
      setPendingStatus(nextStatus);
      return;
    }
    commitChange(nextStatus, false);
  }

  function handleConfirm() {
    if (!pendingStatus) return;
    commitChange(pendingStatus, notify);
    setPendingStatus(null);
  }

  return (
    <>
      <Select
        value={status}
        onValueChange={(value) => handleSelectChange(value as FeatureStatus)}
        disabled={isSaving}
      >
        <SelectTrigger size="sm">
          <SelectValue>
            <StatusBadge status={status} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FEATURE_STATUSES.map((option) => (
            <SelectItem key={option} value={option}>
              {STATUS_LABEL[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog open={pendingStatus !== null} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update status</DialogTitle>
            <DialogDescription>
              {pendingStatus && `Change status to ${STATUS_LABEL[pendingStatus]}?`}
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notify} onCheckedChange={(checked) => setNotify(checked === true)} />
            Notify the {followerCount} people following this
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
