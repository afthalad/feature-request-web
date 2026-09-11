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
import type { AdminUser } from "@/types";

const PAGE_SIZE = 20;

interface UserListProps {
  initialUsers: AdminUser[];
  initialCursor: string | null;
}

export function UserList({ initialUsers, initialCursor }: UserListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [cursor, setCursor] = useState(initialCursor);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function fetchUsers(params: { email?: string; cursorParam?: string | null; append?: boolean }) {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const searchParams = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (params.email) searchParams.set("email", params.email);
      if (params.cursorParam) searchParams.set("cursor", params.cursorParam);

      const response = await fetch(`/api/admin/users?${searchParams}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to load users.");

      setUsers((prev) => (params.append ? [...prev, ...data.users] : data.users));
      setCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    fetchUsers({ email: search.trim() || undefined });
  }

  function handleClear() {
    setSearch("");
    fetchUsers({});
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search by exact email..."
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
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.uid}>
              <TableCell>
                <Link href={`/admin/users/${user.uid}`} className="underline underline-offset-2">
                  {user.email || user.uid}
                </Link>
              </TableCell>
              <TableCell>{user.displayName || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {user.plan}
                </Badge>
              </TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                No users found.
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
            onClick={() => fetchUsers({ cursorParam: cursor, append: true })}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
