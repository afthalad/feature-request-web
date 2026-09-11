import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/requireUser";
import { isAdminUid } from "@/lib/auth/requireAdmin";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdminUid(user.uid)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
