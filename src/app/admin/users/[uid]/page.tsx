import { notFound } from "next/navigation";
import Link from "next/link";
import { getUser, listAppsForUser, listWebhookEventsForUser } from "@/lib/admin/users";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanOverrideForm } from "@/components/admin/PlanOverrideForm";
import { AdminDeleteUserSection } from "@/components/admin/AdminDeleteUserSection";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const user = await getUser(uid);
  if (!user) notFound();

  const [apps, webhookEvents] = await Promise.all([
    listAppsForUser(uid),
    user.dodoCustomerId ? listWebhookEventsForUser(user.dodoCustomerId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{user.email || user.uid}</h1>
        <p className="text-muted-foreground text-sm">
          {user.displayName || "No name"} · joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <p className="text-sm font-medium">Plan override</p>
        <PlanOverrideForm
          uid={uid}
          initialPlan={user.plan}
          initialSubscriptionStatus={user.subscriptionStatus}
        />
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-medium">Billing</p>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Subscription status</dt>
            <dd>{user.subscriptionStatus ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Billing period</dt>
            <dd>{user.billingPeriod ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Next billing date</dt>
            <dd>{user.nextBillingDate ? new Date(user.nextBillingDate).toLocaleDateString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Dodo customer ID</dt>
            <dd className="truncate">{user.dodoCustomerId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Subscription ID</dt>
            <dd className="truncate">{user.subscriptionId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Emails sent this month</dt>
            <dd>{user.emailsSentMonthCount ?? 0}</dd>
          </div>
        </dl>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-medium">Apps ({apps.length})</p>
        {apps.length === 0 ? (
          <p className="text-muted-foreground text-sm">No apps.</p>
        ) : (
          <ul className="space-y-2">
            {apps.map((app) => (
              <li key={app.id} className="flex items-center justify-between text-sm">
                <Link href={`/admin/apps/${app.id}`} className="underline underline-offset-2">
                  {app.name}
                </Link>
                <span className="text-muted-foreground">
                  {app.featureCount} requests{app.disabled ? " · disabled" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-medium">Webhook event log</p>
        {webhookEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {user.dodoCustomerId ? "No webhook events recorded yet." : "No Dodo customer linked."}
          </p>
        ) : (
          <ul className="space-y-2">
            {webhookEvents.map((event) => (
              <li key={event.id} className="flex items-center justify-between text-sm">
                <Badge variant="outline">{event.type}</Badge>
                <span className="text-muted-foreground">
                  {new Date(event.receivedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <AdminDeleteUserSection uid={uid} email={user.email} appCount={apps.length} />
      </Card>
    </div>
  );
}
