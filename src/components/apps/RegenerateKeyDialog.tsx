"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RegenerateKeyDialogProps {
  appId: string;
  onRegenerated: (apiKey: string) => void;
}

export function RegenerateKeyDialog({ appId, onRegenerated }: RegenerateKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/apps/${appId}/key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to regenerate key.");

      setOpen(false);
      onRegenerated(data.apiKey);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate key.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Regenerate key</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate API key?</DialogTitle>
          <DialogDescription>
            The current key will stop working immediately. Any app builds using it won&apos;t be
            able to submit or fetch feature requests until updated with the new key.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Regenerating..." : "Regenerate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
