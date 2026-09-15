"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminDeleteUserSectionProps {
  uid: string;
  email: string;
  appCount: number;
}

export function AdminDeleteUserSection({ uid, email, appCount }: AdminDeleteUserSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to delete user.");
      toast.success("User permanently deleted");
      router.push("/admin/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Delete user permanently</p>
        <p className="text-muted-foreground text-sm">
          Removes their account and sign-in{appCount > 0 ? `, plus ${appCount} owned app${appCount === 1 ? "" : "s"} and everything under them` : ""}. This cannot be undone.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="destructive" />}>Delete</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete {email || uid}?</DialogTitle>
            <DialogDescription>
              {appCount > 0
                ? `This also deletes ${appCount} app${appCount === 1 ? "" : "s"} they own, including every feature request, comment, vote, follower, and API key. `
                : ""}
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
