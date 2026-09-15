import { Skeleton } from "@/components/ui/skeleton";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

export default function AdminAppsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-24" />
      <AdminTableSkeleton />
    </div>
  );
}
