"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PlatformPicker } from "@/components/apps/PlatformPicker";
import type { AppPlatformId } from "@/types";

interface AppSettingsFormProps {
  appId: string;
  initialNotificationEmail: string;
  initialEmailOnNewRequest: boolean;
  initialPlatforms: AppPlatformId[];
}

export function AppSettingsForm({
  appId,
  initialNotificationEmail,
  initialEmailOnNewRequest,
  initialPlatforms,
}: AppSettingsFormProps) {
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail);
  const [emailOnNewRequest, setEmailOnNewRequest] = useState(initialEmailOnNewRequest);
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  async function save(
    patch: Partial<{
      notificationEmail: string;
      emailOnNewRequest: boolean;
      platforms: AppPlatformId[];
    }>
  ) {
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

  function handlePlatformsChange(next: AppPlatformId[]) {
    setPlatforms(next);
    save({ platforms: next });
  }

  async function handleSendTestEmail() {
    setIsSendingTest(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/apps/${appId}/test-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to send test email.");

      toast.success(`Test email sent to ${notificationEmail}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send test email.");
    } finally {
      setIsSendingTest(false);
    }
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
      <div className="space-y-2">
        <p className="text-sm font-medium">Platforms</p>
        <PlatformPicker value={platforms} onChange={handlePlatformsChange} disabled={isSaving} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Email on new request</p>
          <p className="text-muted-foreground text-sm">
            Get an email each time someone submits a new feature request.
          </p>
        </div>
        <Switch checked={emailOnNewRequest} onCheckedChange={handleToggle} disabled={isSaving} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Test notifications</p>
          <p className="text-muted-foreground text-sm">
            Send a test email to {notificationEmail || "your notification email"} to confirm it
            actually arrives.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSendTestEmail}
          disabled={isSendingTest || !notificationEmail}
        >
          {isSendingTest ? "Sending..." : "Send test email"}
        </Button>
      </div>
    </div>
  );
}
