"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LookupResult {
  email: string;
  unsubscribed: boolean;
  createdAt: string | null;
}

async function authedFetch(url: string, init?: RequestInit) {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${idToken}`, ...(init?.headers ?? {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Request failed.");
  return data;
}

export function UnsubscribeLookup() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const data = await authedFetch(`/api/admin/unsubscribes?email=${encodeURIComponent(email.trim())}`);
      setResult(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lookup failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove() {
    if (!result) return;
    setIsRemoving(true);
    try {
      await authedFetch(`/api/admin/unsubscribes?email=${encodeURIComponent(result.email)}`, {
        method: "DELETE",
      });
      setResult({ ...result, unsubscribed: false, createdAt: null });
      toast.success("Removed — they'll receive emails again");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove.");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <form onSubmit={handleLookup} className="flex items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-64"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isLoading}>
          {isLoading ? "Looking up..." : "Look up"}
        </Button>
      </form>

      {result && (
        <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium">{result.email}</p>
            {result.unsubscribed ? (
              <p className="text-muted-foreground">
                Unsubscribed {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : ""}
              </p>
            ) : (
              <p className="text-muted-foreground">Not unsubscribed</p>
            )}
          </div>
          {result.unsubscribed ? (
            <Badge variant="destructive">Unsubscribed</Badge>
          ) : (
            <Badge variant="outline">Subscribed</Badge>
          )}
        </div>
      )}
      {result?.unsubscribed && (
        <Button variant="outline" onClick={handleRemove} disabled={isRemoving}>
          {isRemoving ? "Removing..." : "Remove (resubscribe)"}
        </Button>
      )}
    </Card>
  );
}
