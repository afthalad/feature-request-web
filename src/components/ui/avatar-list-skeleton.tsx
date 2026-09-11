import { Skeleton } from "@/components/ui/skeleton";

export function AvatarListSkeleton() {
  return (
    <div className="space-y-3 py-1">
      {[0, 1].map((row) => (
        <div key={row} className="flex items-start gap-2.5">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-2/3 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
