import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { AppCard } from "@/components/apps/AppCard";
import { buttonVariants } from "@/components/ui/button";
import type { App } from "@/types";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const appsSnapshot = await adminDb
    .collection("apps")
    .where("ownerUid", "==", user.uid)
    .get();

  const apps: App[] = appsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerUid: data.ownerUid,
        name: data.name,
        bundleId: data.bundleId,
        slug: data.slug ?? "",
        apiKeyPrefix: data.apiKeyPrefix,
        notificationEmail: data.notificationEmail,
        emailOnNewRequest: data.emailOnNewRequest,
        featureCount: data.featureCount,
        createdAt: data.createdAt.toDate().toISOString(),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your apps</h1>
        <Link href="/dashboard/apps/new" className={buttonVariants()}>
          New App
        </Link>
      </div>
      {apps.length === 0 ? (
        <p className="text-muted-foreground text-sm">You haven&apos;t created any apps yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
