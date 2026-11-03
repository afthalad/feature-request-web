import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/requireUser";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plans/limits";
import { NewAppFlow } from "@/components/apps/NewAppFlow";

export default async function NewAppPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const plan = await getUserPlan(user.uid);
  return <NewAppFlow maxPlatforms={PLAN_LIMITS[plan].maxPlatformsPerApp} />;
}
