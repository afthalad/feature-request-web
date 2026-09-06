import { Skeleton } from "@/components/ui/skeleton";

export function CommentsSkeleton() {
  return (
    <div className="space-y-3 py-1">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
