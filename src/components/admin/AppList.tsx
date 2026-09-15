"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
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
import { AdminCreateAppDialog } from "@/components/admin/AdminCreateAppDialog";
import { LinkPendingSpinner } from "@/components/admin/LinkPendingSpinner";
import type { App } from "@/types";

const PAGE_SIZE = 20;

interface AppListProps {
  initialApps: App[];
  initialCursor: string | null;
}

export function AppList({ initialApps, initialCursor }: AppListProps) {
  const [apps, setApps] = useState(initialApps);
  const [cursor, setCursor] = useState(initialCursor);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function fetchApps(params: { search?: string; cursorParam?: string | null; append?: boolean }) {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const searchParams = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (params.search) searchParams.set("search", params.search);
      if (params.cursorParam) searchParams.set("cursor", params.cursorParam);

      const response = await fetch(`/api/admin/apps?${searchParams}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to load apps.");

      setApps((prev) => (params.append ? [...prev, ...data.apps] : data.apps));
      setCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    fetchApps({ search: search.trim() || undefined });
  }

  function handleClear() {
    setSearch("");
    fetchApps({});
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by exact slug or bundle ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" disabled={isLoading}>
            Search
          </Button>
          {search && (
            <Button type="button" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
          )}
        </form>
        <AdminCreateAppDialog onCreated={(app) => setApps((prev) => [app, ...prev])} />
      </div>
      {apps.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No apps found"
          description={search ? "Try a different slug or bundle ID." : "Apps created by users will show up here."}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Bundle ID</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link
                      href={`/admin/apps/${app.id}`}
                      className="inline-flex items-center gap-1.5 underline underline-offset-2"
                    >
                      {app.name}
                      <LinkPendingSpinner />
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{app.bundleId}</TableCell>
                  <TableCell>{app.featureCount}</TableCell>
                  <TableCell>
                    {app.disabled ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
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
            onClick={() => fetchApps({ cursorParam: cursor, append: true })}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
