"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
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
                <Link href={`/admin/apps/${app.id}`} className="underline underline-offset-2">
                  {app.name}
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
          {apps.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                No apps found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
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
