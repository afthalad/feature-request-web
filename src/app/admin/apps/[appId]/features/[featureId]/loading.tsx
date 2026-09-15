import { Skeleton } from "@/components/ui/skeleton";

export default function AdminFeatureDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
