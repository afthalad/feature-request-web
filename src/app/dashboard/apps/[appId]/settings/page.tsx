import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { AppSettingsForm } from "@/components/apps/AppSettingsForm";
import { AppDetailsForm } from "@/components/apps/AppDetailsForm";
import { ApiKeySection } from "@/components/apps/ApiKeySection";
import { PublicBoardSettings } from "@/components/apps/PublicBoardSettings";
import { DeleteAppSection } from "@/components/apps/DeleteAppSection";
import { Separator } from "@/components/ui/separator";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plans/limits";

export default async function AppSettingsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const [user, appSnap] = await Promise.all([
    getSessionUser(),
    adminDb.collection("apps").doc(appId).get(),
  ]);
  if (!user) redirect("/login");
  if (
    !appSnap.exists ||
    appSnap.data()!.ownerUid !== user.uid ||
    appSnap.get("deleted") === true
  ) {
    notFound();
  }

  const app = appSnap.data()!;
  const plan = await getUserPlan(user.uid);

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-xl font-semibold">Settings</h1>
      <AppDetailsForm appId={appId} initialName={app.name} initialBundleId={app.bundleId} />
      <Separator />
      <ApiKeySection appId={appId} apiKeyPrefix={app.apiKeyPrefix} />
      <Separator />
      <PublicBoardSettings
        appId={appId}
        initialSlug={app.slug ?? ""}
        initialHideVoteCounts={app.hideVoteCounts ?? false}
        hasPublicBoard={PLAN_LIMITS[plan].publicBoard}
      />
      <Separator />
      <AppSettingsForm
        appId={appId}
        initialNotificationEmail={app.notificationEmail}
        initialEmailOnNewRequest={app.emailOnNewRequest}
        initialPlatforms={app.platforms ?? []}
      />
      <Separator />
      <DeleteAppSection appId={appId} appName={app.name} featureCount={app.featureCount ?? 0} />
    </div>
  );
}
