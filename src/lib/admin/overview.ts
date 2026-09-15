import "server-only";
import { AggregateField, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export interface AdminOverviewStats {
  userCount: number;
  appCount: number;
  disabledAppCount: number;
  activeApiKeyCount: number;
  totalFeatureCount: number;
  planBreakdown: { free: number; starter: number; pro: number };
  recentApps: { id: string; name: string; createdAt: string }[];
  recentUsers: { uid: string; email: string; createdAt: string }[];
}

export async function getOverviewStats(): Promise<AdminOverviewStats> {
  const usersRef = adminDb.collection("users");
  const appsRef = adminDb.collection("apps");
  const apiKeysRef = adminDb.collection("apiKeys");

  const [
    userCountSnap,
    appCountSnap,
    disabledAppCountSnap,
    activeApiKeyCountSnap,
    starterSnap,
    proSnap,
    featureTotalSnap,
    recentAppsSnap,
    recentUsersSnap,
  ] = await Promise.all([
    usersRef.count().get(),
    appsRef.count().get(),
    appsRef.where("disabled", "==", true).count().get(),
    apiKeysRef.where("active", "==", true).count().get(),
    usersRef.where("plan", "==", "starter").count().get(),
    usersRef.where("plan", "==", "pro").count().get(),
    appsRef.aggregate({ total: AggregateField.sum("featureCount") }).get(),
    appsRef.orderBy("createdAt", "desc").limit(5).get(),
    usersRef.orderBy("createdAt", "desc").limit(5).get(),
  ]);

  const userCount = userCountSnap.data().count;
  const starter = starterSnap.data().count;
  const pro = proSnap.data().count;

  return {
    userCount,
    appCount: appCountSnap.data().count,
    disabledAppCount: disabledAppCountSnap.data().count,
    activeApiKeyCount: activeApiKeyCountSnap.data().count,
    totalFeatureCount: featureTotalSnap.data().total ?? 0,
    planBreakdown: { free: Math.max(userCount - starter - pro, 0), starter, pro },
    recentApps: recentAppsSnap.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      name: doc.data().name as string,
      createdAt: doc.data().createdAt.toDate().toISOString() as string,
    })),
    recentUsers: recentUsersSnap.docs.map((doc: QueryDocumentSnapshot) => ({
      uid: doc.id,
      email: (doc.data().email as string) ?? "",
      createdAt: doc.data().createdAt?.toDate().toISOString() ?? new Date(0).toISOString(),
    })),
  };
}
