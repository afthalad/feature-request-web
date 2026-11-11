import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { AppSettingsForm } from "@/components/apps/AppSettingsForm";
import { AppDetailsForm } from "@/components/apps/AppDetailsForm";
import { ApiKeySection } from "@/components/apps/ApiKeySection";
import { PublicBoardSettings } from "@/components/apps/PublicBoardSettings";
import { DeleteAppSection } from "@/components/apps/DeleteAppSection";
import { Separator } from "@/components/ui/separator";
import { SettingsSection } from "@/components/apps/SettingsSection";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plans/limits";
import { readAppIds } from "@/lib/apps/appIds";

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
    <div className="max-w-xl space-y-10">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsSection
        title="App"
        description="Your API key only works in the apps and websites you add here."
      >
        <AppDetailsForm
          appId={appId}
          initialName={app.name}
          initialAppIds={readAppIds(app)}
          maxPlatforms={PLAN_LIMITS[plan].maxPlatformsPerApp}
        />
      </SettingsSection>
      <Separator />
      <SettingsSection
        title="API key"
        description="Your app sends this key to load its board. You only see the full key once."
      >
        <ApiKeySection appId={appId} apiKeyPrefix={app.apiKeyPrefix} />
      </SettingsSection>
      <Separator />
      <SettingsSection title="Public board">
        <PublicBoardSettings
          appId={appId}
          initialSlug={app.slug ?? ""}
          initialHideVoteCounts={app.hideVoteCounts ?? false}
          hasPublicBoard={PLAN_LIMITS[plan].publicBoard}
        />
      </SettingsSection>
      <Separator />
      <SettingsSection title="Notifications">
        <AppSettingsForm
          appId={appId}
          initialNotificationEmail={app.notificationEmail}
          initialEmailOnNewRequest={app.emailOnNewRequest}
        />
      </SettingsSection>
      <Separator />
      <DeleteAppSection appId={appId} appName={app.name} featureCount={app.featureCount ?? 0} />
    </div>
  );
}
