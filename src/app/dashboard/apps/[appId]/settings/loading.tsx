import { Skeleton } from "@/components/ui/skeleton";

export default function AppSettingsLoading() {
  return (
    <div className="max-w-lg space-y-8">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
