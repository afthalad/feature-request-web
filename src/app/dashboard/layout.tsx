import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/requireUser";
import { adminDb } from "@/lib/firebase/admin";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppSidebar, type SidebarApp } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Plan } from "@/types";

// The sidebar's app list and plan come from the server. Pages that change them (creating or
// deleting an app) call router.refresh() so this layout re-renders.
async function loadSidebarData(): Promise<{
  apps: SidebarApp[];
  plan: Plan;
  hasBillingAccount: boolean;
}> {
  const user = await getSessionUser();
  if (!user) return { apps: [], plan: "free", hasBillingAccount: false };

  const [appsSnap, userSnap] = await Promise.all([
    adminDb.collection("apps").where("ownerUid", "==", user.uid).get(),
    adminDb.collection("users").doc(user.uid).get(),
  ]);
  const userPlan = userSnap.data()?.plan;
  const liveApps = appsSnap.docs.filter((doc) => doc.get("deleted") !== true);
  // "New" matches the dashboard's New badge: arrived since the owner last opened the app.
  const newCounts = await Promise.all(
    liveApps.map((doc) => {
      const lastViewed = doc.get("featuresLastViewedAt");
      if (!lastViewed) return Promise.resolve((doc.get("featureCount") as number) ?? 0);
      return doc.ref
        .collection("features")
        .where("createdAt", ">", lastViewed)
        .count()
        .get()
        .then((snap) => snap.data().count);
    }),
  );
  const apps = liveApps
    .map((doc, index) => ({
      id: doc.id,
      name: doc.get("name") as string,
      featureCount: (doc.get("featureCount") as number) ?? 0,
      newCount: newCounts[index],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    apps,
    plan: userPlan === "pro" || userPlan === "starter" ? userPlan : "free",
    hasBillingAccount: Boolean(userSnap.data()?.dodoCustomerId),
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebar, cookieStore, user] = await Promise.all([
    loadSidebarData(),
    cookies(),
    getSessionUser(),
  ]);
  // Remember whether the sidebar was collapsed (the shadcn sidebar writes this cookie).
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <AuthGuard sessionIssuedAt={user ? user.iat * 1000 : null}>
      <TooltipProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar {...sidebar} />
          <SidebarInset>
            <header className="bg-background sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4">
              <SidebarTrigger />
              <ThemeToggle />
            </header>
            <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  );
}
