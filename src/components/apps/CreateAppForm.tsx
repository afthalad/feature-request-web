"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getCurrentIdToken } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { AppIdFields, EMPTY_APP_ID_VALUES, toAppIds } from "@/components/apps/AppIdFields";
import { hasAppId } from "@/lib/apps/appIds";
import type { ApiErrorBody } from "@/types";
import { track } from "@/lib/analytics/client";

interface CreateAppFormProps {
  onCreated: (apiKey: string) => void;
  maxPlatforms: number;
}

export function CreateAppForm({ onCreated, maxPlatforms }: CreateAppFormProps) {
  const [name, setName] = useState("");
  const [appIdValues, setAppIdValues] = useState(EMPTY_APP_ID_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const appIds = toAppIds(appIdValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const idToken = await getCurrentIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch("/api/internal/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ name, ...appIds }),
      });
      const data: { apiKey?: string } & Partial<ApiErrorBody> = await response.json();
      if (!response.ok) {
        if (data.error?.code === "limit_reached") {
          track("app_create_blocked", { message: data.error.message });
          setLimitMessage(data.error.message);
          return;
        }
        throw new Error(data.error?.message ?? "Failed to create app.");
      }

      onCreated(data.apiKey!);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create app.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">App name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
          />
        </div>
        <AppIdFields
        value={appIdValues}
        onChange={setAppIdValues}
        disabled={isSubmitting}
        maxPlatforms={maxPlatforms}
      />
        <Button type="submit" disabled={isSubmitting || !hasAppId(appIds)} className="w-full">
          {isSubmitting ? "Creating..." : "Create app"}
        </Button>
      </form>
      <UpgradeDialog
        reason="app_limit"
        open={limitMessage !== null}
        onOpenChange={(open) => !open && setLimitMessage(null)}
        title="You've hit your app limit"
        description={limitMessage ?? ""}
      />
    </>
  );
}
