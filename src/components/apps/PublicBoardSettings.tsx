"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PublicBoardSettingsProps {
  appId: string;
  initialSlug: string;
}

export function PublicBoardSettings({ appId, initialSlug }: PublicBoardSettingsProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [isSaving, setIsSaving] = useState(false);

  const boardUrl =
    typeof window !== "undefined" ? `${window.location.origin}/b/${savedSlug}` : `/b/${savedSlug}`;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to save.");

      setSavedSlug(slug);
      toast.success("Public board URL updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(boardUrl);
    toast.success("Link copied");
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="slug">Public board</Label>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          id="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          minLength={3}
          maxLength={60}
        />
        <Button type="submit" variant="outline" disabled={isSaving || slug === savedSlug}>
          Save
        </Button>
      </form>
      <div className="flex items-center gap-2">
        <a
          href={`/b/${savedSlug}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground text-sm underline underline-offset-2"
        >
          {boardUrl}
        </a>
        <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
          Copy
        </Button>
      </div>
    </div>
  );
}
