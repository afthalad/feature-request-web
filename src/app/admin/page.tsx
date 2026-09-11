import { Card } from "@/components/ui/card";
import { getOverviewStats } from "@/lib/admin/overview";

export default async function AdminOverviewPage() {
  const stats = await getOverviewStats();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-muted-foreground text-sm">Users</p>
          <p className="text-2xl font-semibold">{stats.userCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-muted-foreground text-sm">Apps</p>
          <p className="text-2xl font-semibold">{stats.appCount}</p>
        </Card>
      </div>
      <Card className="p-5">
        <p className="text-muted-foreground mb-4 text-sm">Plan breakdown</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Free</p>
            <p className="text-xl font-semibold">{stats.planBreakdown.free}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Starter</p>
            <p className="text-xl font-semibold">{stats.planBreakdown.starter}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Pro</p>
            <p className="text-xl font-semibold">{stats.planBreakdown.pro}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
