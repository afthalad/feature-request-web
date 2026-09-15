"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminApiKey } from "@/types";

type FilterTab = "all" | "active" | "revoked";
const PAGE_SIZE = 20;

interface ApiKeyListProps {
  initialKeys: AdminApiKey[];
  initialCursor: string | null;
}

export function ApiKeyList({ initialKeys, initialCursor }: ApiKeyListProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [keys, setKeys] = useState(initialKeys);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  async function fetchKeys(nextFilter: FilterTab, cursorParam: string | null, append: boolean) {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (nextFilter !== "all") params.set("active", nextFilter === "active" ? "true" : "false");
      if (cursorParam) params.set("cursor", cursorParam);

      const response = await fetch(`/api/admin/api-keys?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to load API keys.");

      setKeys((prev) => (append ? [...prev, ...data.keys] : data.keys));
      setCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(nextFilter: FilterTab) {
    setFilter(nextFilter);
    fetchKeys(nextFilter, null, false);
  }

  async function handleRevoke() {
    if (!pendingHash) return;
    const hash = pendingHash;
    setIsRevoking(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/api-keys/${hash}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to revoke key.");

      setKeys((prev) => prev.map((key) => (key.hash === hash ? { ...key, active: false } : key)));
      toast.success("Key revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke key.");
    } finally {
      setIsRevoking(false);
      setPendingHash(null);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(value) => handleFilterChange(value as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="revoked">Revoked</TabsTrigger>
        </TabsList>
      </Tabs>
      {keys.length === 0 ? (
        <EmptyState icon={KeyRound} title="No API keys found" description="Keys are created when a user sets up an app." />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead>Key hash</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.hash}>
                  <TableCell>{key.appName}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {key.hash.slice(0, 16)}…
                  </TableCell>
                  <TableCell>
                    {key.active ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Revoked</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {key.active && (
                      <Button variant="ghost" size="sm" onClick={() => setPendingHash(key.hash)}>
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {cursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchKeys(filter, cursor, true)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}

      <Dialog open={pendingHash !== null} onOpenChange={(open) => !open && setPendingHash(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke this API key?</DialogTitle>
            <DialogDescription>
              Any app builds using it will immediately stop being able to submit or fetch feature
              requests.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingHash(null)} disabled={isRevoking}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={isRevoking}>
              {isRevoking ? "Revoking..." : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
