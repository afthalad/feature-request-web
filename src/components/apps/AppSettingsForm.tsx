"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface AppSettingsFormProps {
  appId: string;
  initialNotificationEmail: string;
  initialEmailOnNewRequest: boolean;
}

export function AppSettingsForm({
  appId,
  initialNotificationEmail,
  initialEmailOnNewRequest,
}: AppSettingsFormProps) {
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail);
  const [emailOnNewRequest, setEmailOnNewRequest] = useState(initialEmailOnNewRequest);
  const [isSaving, setIsSaving] = useState(false);

  async function save(patch: Partial<{ notificationEmail: string; emailOnNewRequest: boolean }>) {
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("Failed to save settings.");
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleToggle(checked: boolean) {
    setEmailOnNewRequest(checked);
    save({ emailOnNewRequest: checked });
  }

  function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    save({ notificationEmail });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleEmailSubmit} className="space-y-2">
        <Label htmlFor="notificationEmail">Notification email</Label>
        <div className="flex gap-2">
          <Input
            id="notificationEmail"
            type="email"
            value={notificationEmail}
            onChange={(event) => setNotificationEmail(event.target.value)}
          />
          <Button type="submit" variant="outline" disabled={isSaving}>
            Save
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Email on new request</p>
          <p className="text-muted-foreground text-sm">
            Get an email each time someone submits a new feature request.
          </p>
        </div>
        <Switch checked={emailOnNewRequest} onCheckedChange={handleToggle} disabled={isSaving} />
      </div>
    </div>
  );
}
