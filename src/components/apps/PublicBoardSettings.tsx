"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface PublicBoardSettingsProps {
  appId: string;
  initialSlug: string;
  initialHideVoteCounts: boolean;
}

export function PublicBoardSettings({
  appId,
  initialSlug,
  initialHideVoteCounts,
}: PublicBoardSettingsProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [isSaving, setIsSaving] = useState(false);
  const [hideVoteCounts, setHideVoteCounts] = useState(initialHideVoteCounts);
  const [isSavingHideVoteCounts, setIsSavingHideVoteCounts] = useState(false);

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
      router.refresh();
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

  async function handleHideVoteCountsToggle(checked: boolean) {
    setHideVoteCounts(checked);
    setIsSavingHideVoteCounts(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ hideVoteCounts: checked }),
      });
      if (!response.ok) throw new Error("Failed to save.");
      toast.success("Settings saved");
      router.refresh();
    } catch (error) {
      setHideVoteCounts(!checked);
      toast.error(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setIsSavingHideVoteCounts(false);
    }
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
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm font-medium">Hide vote counts</p>
          <p className="text-muted-foreground text-sm">
            Voting still works, but visitors won&apos;t see how many votes a request has.
          </p>
        </div>
        <Switch
          checked={hideVoteCounts}
          onCheckedChange={handleHideVoteCountsToggle}
          disabled={isSavingHideVoteCounts}
        />
      </div>
    </div>
  );
}
