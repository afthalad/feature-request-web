"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AppDetailsFormProps {
  appId: string;
  initialName: string;
  initialBundleId: string;
}

export function AppDetailsForm({ appId, initialName, initialBundleId }: AppDetailsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bundleId, setBundleId] = useState(initialBundleId);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ name, bundleId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error?.message ?? "Failed to save.");

      toast.success("App details updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="appName">App name</Label>
        <Input
          id="appName"
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
      <Button type="submit" variant="outline" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
