"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppIdFields, EMPTY_APP_ID_VALUES, toAppIds } from "@/components/apps/AppIdFields";
import { hasAppId } from "@/lib/apps/appIds";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AdminUser, App } from "@/types";

async function authedFetch(path: string, init?: RequestInit) {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message ?? "Request failed.");
  return data;
}

interface AdminCreateAppDialogProps {
  onCreated: (app: App) => void;
}

export function AdminCreateAppDialog({ onCreated }: AdminCreateAppDialogProps) {
  const [open, setOpen] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [name, setName] = useState("");
  const [appIdValues, setAppIdValues] = useState(EMPTY_APP_ID_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setOwnerEmail("");
    setName("");
    setAppIdValues(EMPTY_APP_ID_VALUES);
  }

  const appIds = toAppIds(appIdValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { users } = (await authedFetch(
        `/api/admin/users?email=${encodeURIComponent(ownerEmail.trim())}&limit=1`
      )) as { users: AdminUser[] };
      const owner = users[0];
      if (!owner) throw new Error("No user found with that email.");

      const { app } = await authedFetch("/api/admin/apps", {
        method: "POST",
        body: JSON.stringify({ ownerUid: owner.uid, name, ...appIds }),
      });

      toast.success("App created");
      onCreated(app);
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create app.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>New app</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an app</DialogTitle>
          <DialogDescription>
            Creates an app on behalf of an existing user, bypassing their plan&apos;s app limit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ownerEmail">Owner email</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              placeholder="owner@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appName">App name</Label>
            <Input
              id="appName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              required
            />
          </div>
          <AppIdFields value={appIdValues} onChange={setAppIdValues} disabled={isSubmitting} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasAppId(appIds)}>
              {isSubmitting ? "Creating..." : "Create app"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
