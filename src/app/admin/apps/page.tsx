import { listApps } from "@/lib/admin/apps";
import { AppList } from "@/components/admin/AppList";

export default async function AdminAppsPage() {
  const { apps, nextCursor } = await listApps({ limit: 20, cursor: null });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Apps</h1>
      <AppList initialApps={apps} initialCursor={nextCursor} />
    </div>
  );
}
