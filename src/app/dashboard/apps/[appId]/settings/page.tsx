import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { AppSettingsForm } from "@/components/apps/AppSettingsForm";
import { ApiKeySection } from "@/components/apps/ApiKeySection";
import { PublicBoardSettings } from "@/components/apps/PublicBoardSettings";
import { Separator } from "@/components/ui/separator";

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
  if (!appSnap.exists || appSnap.data()!.ownerUid !== user.uid) notFound();

  const app = appSnap.data()!;

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-xl font-semibold">Settings</h1>
      <ApiKeySection appId={appId} apiKeyPrefix={app.apiKeyPrefix} />
      <Separator />
      <PublicBoardSettings
        appId={appId}
        initialSlug={app.slug ?? ""}
        initialHideVoteCounts={app.hideVoteCounts ?? false}
      />
      <Separator />
      <AppSettingsForm
        appId={appId}
        initialNotificationEmail={app.notificationEmail}
        initialEmailOnNewRequest={app.emailOnNewRequest}
      />
    </div>
  );
}
