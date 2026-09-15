import { Skeleton } from "@/components/ui/skeleton";

// Shared list-page loading skeleton — mirrors the search bar + table shape used by AppList,
// UserList, and ApiKeyList so route transitions into those pages don't flash blank content.
export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}
