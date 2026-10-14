"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteAppSectionProps {
  appId: string;
  appName: string;
  featureCount: number;
}

export function DeleteAppSection({ appId, appName, featureCount }: DeleteAppSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmed = typedName.trim() === appName.trim();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setTypedName("");
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/apps/${appId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error?.message ?? "Failed to delete app.");

      toast.success(`${appName} deleted`);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete app.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Delete app</p>
        <p className="text-muted-foreground text-sm">
          Removes this app and everything in it, and turns off its API key.
        </p>
      </div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={<Button variant="destructive" />}>Delete app</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {appName}?</DialogTitle>
            <DialogDescription>This deletes:</DialogDescription>
          </DialogHeader>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            <li>
              All {featureCount} feature request{featureCount === 1 ? "" : "s"}, with their votes
              and comments
            </li>
            <li>Everyone following a request, and the update emails they would get</li>
            <li>
              The API key. Apps using the Fewchurs SDK with it stop loading the board right away.
            </li>
            <li>The public board link</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            You can&apos;t undo this from your dashboard. If you delete it by mistake, contact
            support.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-app-name">
              Type <span className="text-foreground font-semibold">{appName}</span> to confirm
            </Label>
            <Input
              id="confirm-app-name"
              value={typedName}
              onChange={(event) => setTypedName(event.target.value)}
              autoComplete="off"
              disabled={isDeleting}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!confirmed || isDeleting}>
              {isDeleting ? "Deleting..." : "Delete app"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
