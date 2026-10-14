"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { App } from "@/types";

export function AdminAppSettingsForm({ app }: { app: App }) {
  const router = useRouter();
  const [name, setName] = useState(app.name);
  const [notificationEmail, setNotificationEmail] = useState(app.notificationEmail);
  const [emailOnNewRequest, setEmailOnNewRequest] = useState(app.emailOnNewRequest);
  const [disabled, setDisabled] = useState(app.disabled ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  async function patch(body: Record<string, unknown>) {
    const idToken = await auth.currentUser?.getIdToken();
    const response = await fetch(`/api/admin/apps/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? "Failed to save.");
    return data;
  }

  async function handleFieldsSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await patch({ name, notificationEmail, emailOnNewRequest });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleDisabled() {
    setIsSaving(true);
    try {
      await patch({ disabled: !disabled });
      setDisabled(!disabled);
      setConfirmOpen(false);
      toast.success(disabled ? "App re-enabled" : "App disabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update app.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRestore() {
    setIsSaving(true);
    try {
      await patch({ restore: true });
      setRestoreOpen(false);
      toast.success("App restored");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore app.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/apps/${app.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to delete app.");
      toast.success("App permanently deleted");
      router.push("/admin/apps");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete app.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {app.deleted && (
        <div className="bg-destructive/5 flex items-center justify-between gap-4 rounded-lg border border-destructive/20 p-4">
          <div>
            <p className="text-sm font-medium">
              Deleted by owner
              {app.deletedAt && <> on {new Date(app.deletedAt).toLocaleDateString()}</>}
            </p>
            <p className="text-muted-foreground text-sm">
              Its API key is off, the public board is gone, and it&apos;s hidden from the
              owner&apos;s dashboard. All data is kept until you restore or delete it.
            </p>
          </div>
          <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
            <DialogTrigger render={<Button variant="outline" />}>Restore</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restore &ldquo;{app.name}&rdquo;?</DialogTitle>
                <DialogDescription>
                  The app comes back to the owner&apos;s dashboard with all its data. Its API key
                  works again, so apps using it load the board again, and the public board gets
                  its link back (or a new one if that link was taken).
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRestoreOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleRestore} disabled={isSaving}>
                  {isSaving ? "Restoring..." : "Restore"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <form onSubmit={handleFieldsSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notificationEmail">Notification email</Label>
          <Input
            id="notificationEmail"
            type="email"
            value={notificationEmail}
            onChange={(event) => setNotificationEmail(event.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm">Email on new request</p>
          <Switch
            checked={emailOnNewRequest}
            onCheckedChange={setEmailOnNewRequest}
            disabled={isSaving}
          />
        </div>
        <Button type="submit" variant="outline" disabled={isSaving}>
          Save
        </Button>
      </form>

      {!app.deleted && (
        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <p className="text-sm font-medium">{disabled ? "App is disabled" : "Disable app"}</p>
            <p className="text-muted-foreground text-sm">
              {disabled
                ? "The public board 404s. Data is kept."
                : "Clears the public slug so the board 404s. Data is kept."}
            </p>
          </div>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger render={<Button variant={disabled ? "outline" : "destructive"} />}>
              {disabled ? "Re-enable" : "Disable"}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{disabled ? "Re-enable this app?" : "Disable this app?"}</DialogTitle>
                <DialogDescription>
                  {disabled
                    ? "This restores the public board at its previous URL."
                    : "The public board will 404 immediately. All data is kept and this can be reversed."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  variant={disabled ? "default" : "destructive"}
                  onClick={handleToggleDisabled}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : disabled ? "Re-enable" : "Disable"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-sm font-medium">Delete app permanently</p>
          <p className="text-muted-foreground text-sm">
            Removes the app, its feature requests, comments, votes, followers, and API keys.
            This cannot be undone.
          </p>
        </div>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger render={<Button variant="destructive" />}>Delete</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Permanently delete &ldquo;{app.name}&rdquo;?</DialogTitle>
              <DialogDescription>
                This deletes the app and everything under it — feature requests, comments,
                votes, followers, and API keys. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
