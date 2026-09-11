import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export interface AdminOverviewStats {
  userCount: number;
  appCount: number;
  planBreakdown: { free: number; starter: number; pro: number };
}

export async function getOverviewStats(): Promise<AdminOverviewStats> {
  const usersRef = adminDb.collection("users");
  const appsRef = adminDb.collection("apps");

  const [userCountSnap, appCountSnap, starterSnap, proSnap] = await Promise.all([
    usersRef.count().get(),
    appsRef.count().get(),
    usersRef.where("plan", "==", "starter").count().get(),
    usersRef.where("plan", "==", "pro").count().get(),
  ]);

  const userCount = userCountSnap.data().count;
  const starter = starterSnap.data().count;
  const pro = proSnap.data().count;

  return {
    userCount,
    appCount: appCountSnap.data().count,
    planBreakdown: { free: Math.max(userCount - starter - pro, 0), starter, pro },
  };
}
