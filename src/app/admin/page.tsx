import Link from "next/link";
import { Users, LayoutGrid, Inbox, KeyRound, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOverviewStats } from "@/lib/admin/overview";

const QUICK_LINKS = [
  { href: "/admin/apps", label: "Manage apps", icon: LayoutGrid },
  { href: "/admin/users", label: "Manage users", icon: Users },
  { href: "/admin/api-keys", label: "Manage API keys", icon: KeyRound },
  { href: "/admin/unsubscribes", label: "Unsubscribes", icon: Ban },
];

export default async function AdminOverviewPage() {
  const stats = await getOverviewStats();

  const statCards = [
    { label: "Users", value: stats.userCount, icon: Users },
    { label: "Apps", value: stats.appCount, icon: LayoutGrid },
    { label: "Feature requests", value: stats.totalFeatureCount, icon: Inbox },
    { label: "Active API keys", value: stats.activeApiKeyCount, icon: KeyRound },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Platform-wide activity across every user and app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-sm">{label}</p>
              <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
            </div>
            <div className="bg-foreground text-background flex size-10 shrink-0 items-center justify-center rounded-full">
              <Icon className="size-4" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-muted-foreground mb-4 text-sm">Plan breakdown</p>
          <div className="grid grid-cols-3 gap-4">
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

        <Card className="p-5">
          <p className="text-muted-foreground mb-4 text-sm">App health</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Active</p>
              <p className="text-xl font-semibold">{stats.appCount - stats.disabledAppCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Disabled</p>
              <p className="text-xl font-semibold">{stats.disabledAppCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3 p-5">
          <p className="text-sm font-medium">Recently created apps</p>
          {stats.recentApps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No apps yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentApps.map((app) => (
                <li key={app.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/apps/${app.id}`} className="truncate underline underline-offset-2">
                    {app.name}
                  </Link>
                  <span className="text-muted-foreground shrink-0">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <p className="text-sm font-medium">Recently joined users</p>
          {stats.recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentUsers.map((user) => (
                <li key={user.uid} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/admin/users/${user.uid}`}
                    className="truncate underline underline-offset-2"
                  >
                    {user.email || user.uid}
                  </Link>
                  <span className="text-muted-foreground shrink-0">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-muted-foreground mb-3 text-sm">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Badge
                variant="outline"
                className="hover:bg-muted flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
              >
                <Icon className="size-3.5" />
                {label}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
