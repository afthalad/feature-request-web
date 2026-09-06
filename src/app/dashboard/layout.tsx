import { AuthGuard } from "@/components/layout/AuthGuard";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardHeader />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8">{children}</main>
    </AuthGuard>
  );
}
