"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { PlatformPicker } from "@/components/apps/PlatformPicker";
import type { ApiErrorBody, AppPlatformId } from "@/types";

interface CreateAppFormProps {
  onCreated: (apiKey: string) => void;
}

export function CreateAppForm({ onCreated }: CreateAppFormProps) {
  const [name, setName] = useState("");
  const [bundleId, setBundleId] = useState("");
  const [platforms, setPlatforms] = useState<AppPlatformId[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch("/api/internal/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ name, bundleId, platforms }),
      });
      const data: { apiKey?: string } & Partial<ApiErrorBody> = await response.json();
      if (!response.ok) {
        if (data.error?.code === "limit_reached") {
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
        <div className="space-y-2">
          <Label htmlFor="bundleId">Bundle ID</Label>
          <Input
            id="bundleId"
            value={bundleId}
            onChange={(event) => setBundleId(event.target.value)}
            placeholder="com.yourcompany.app"
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Platforms (optional)</Label>
          <PlatformPicker value={platforms} onChange={setPlatforms} disabled={isSubmitting} />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create app"}
        </Button>
      </form>
      <UpgradeDialog
        open={limitMessage !== null}
        onOpenChange={(open) => !open && setLimitMessage(null)}
        title="You've hit your app limit"
        description={limitMessage ?? ""}
      />
    </>
  );
}
