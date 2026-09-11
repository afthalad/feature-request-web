"use client";

import { useState, type FormEvent } from "react";
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
  const [name, setName] = useState(app.name);
  const [notificationEmail, setNotificationEmail] = useState(app.notificationEmail);
  const [emailOnNewRequest, setEmailOnNewRequest] = useState(app.emailOnNewRequest);
  const [disabled, setDisabled] = useState(app.disabled ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  return (
    <div className="space-y-6">
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
    </div>
  );
}
